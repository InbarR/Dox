import { exec } from 'child_process';
import { promisify } from 'util';
import { BrowserWindow } from 'electron';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);
const LOG_FILE = path.join(os.tmpdir(), 'dox-chat.log');

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try { fs.appendFileSync(LOG_FILE, line); } catch {}
}

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getGitHubToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  try {
    const { stdout } = await execAsync('gh auth token', { timeout: 5000 });
    cachedToken = stdout.trim();
    tokenExpiry = Date.now() + 30 * 60 * 1000;
    log('Got GH token: ' + cachedToken.substring(0, 8) + '...');
    return cachedToken;
  } catch (err: any) {
    log('Failed to get GH token: ' + err.message);
    throw new Error('Failed to get GitHub token. Make sure gh CLI is authenticated.');
  }
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function streamChat(
  messages: ChatMessage[],
  win: BrowserWindow
): Promise<void> {
  const token = await getGitHubToken();

  const body = JSON.stringify({
    model: 'gpt-4o',
    messages,
    stream: true,
    temperature: 0.7,
    max_tokens: 2048,
  });

  log(`Sending chat request with ${messages.length} messages`);

  return new Promise<void>((resolve, reject) => {
    const req = https.request(
      'https://models.inference.ai.azure.com/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'text/event-stream',
        },
      },
      (res) => {
        log(`Response status: ${res.statusCode}`);

        if (res.statusCode !== 200) {
          let errorBody = '';
          res.on('data', (chunk) => (errorBody += chunk.toString()));
          res.on('end', () => {
            log(`API error: ${errorBody.substring(0, 300)}`);
            reject(new Error(`API error ${res.statusCode}: ${errorBody.substring(0, 200)}`));
          });
          return;
        }

        let buffer = '';
        res.on('data', (chunk) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === 'data: [DONE]') continue;
            if (!trimmed.startsWith('data: ')) continue;

            try {
              const json = JSON.parse(trimmed.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                win.webContents.send('chat-chunk', content);
              }
            } catch {}
          }
        });

        res.on('end', () => {
          log('Stream ended');
          win.webContents.send('chat-done');
          resolve();
        });

        res.on('error', (err) => {
          log('Stream error: ' + err.message);
          reject(err);
        });
      }
    );

    req.on('error', (err) => {
      log('Request error: ' + err.message);
      reject(err);
    });

    req.write(body);
    req.end();
  });
}
