import { exec } from 'child_process';
import { promisify } from 'util';
import { BrowserWindow, session } from 'electron';

const execAsync = promisify(exec);

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getGitHubToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const { stdout } = await execAsync('gh auth token', { timeout: 5000 });
  cachedToken = stdout.trim();
  tokenExpiry = Date.now() + 30 * 60 * 1000;
  return cachedToken;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function chatComplete(
  messages: ChatMessage[]
): Promise<string> {
  const token = await getGitHubToken();

  const response = await session.defaultSession.fetch(
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
        temperature: 0.7,
        max_tokens: 2048,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error ${response.status}: ${errorText.substring(0, 200)}`);
  }

  const json = await response.json();
  return json.choices?.[0]?.message?.content || '';
}
