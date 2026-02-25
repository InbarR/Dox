import { exec } from 'child_process';
import { promisify } from 'util';
import { BrowserWindow } from 'electron';

const execAsync = promisify(exec);

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getGitHubToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  try {
    const { stdout } = await execAsync('gh auth token', { timeout: 5000 });
    cachedToken = stdout.trim();
    tokenExpiry = Date.now() + 30 * 60 * 1000; // cache 30 min
    return cachedToken;
  } catch {
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

  const response = await fetch(
    'https://models.inference.ai.azure.com/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
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
      } catch { /* skip malformed chunks */ }
    }
  }

  win.webContents.send('chat-done');
}
