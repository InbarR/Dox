import {
  PublicClientApplication,
  CryptoProvider,
  Configuration,
  AccountInfo,
  AuthenticationResult,
} from '@azure/msal-node';
import { BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

const SCOPES = ['Files.Read.All', 'Sites.Read.All', 'User.Read'];
const REDIRECT_URI = 'http://localhost';
const CACHE_FILE = path.join(
  app.getPath('userData'),
  'docshelf-data',
  'msal-cache.json'
);

export interface GraphDoc {
  title: string;
  url: string;
  type: 'doc' | 'ppt' | 'xls' | 'pdf' | 'other';
  source: 'sharepoint' | 'onedrive' | 'other';
  sharedBy: string;
  lastModified?: string;
}

let pca: PublicClientApplication | null = null;

function getClientId(): string | null {
  const settingsFile = path.join(
    app.getPath('userData'),
    'docshelf-data',
    'settings.json'
  );
  try {
    if (fs.existsSync(settingsFile)) {
      const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
      return settings.clientId || null;
    }
  } catch {}
  return null;
}

export function saveClientId(clientId: string) {
  const dir = path.join(app.getPath('userData'), 'docshelf-data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const settingsFile = path.join(dir, 'settings.json');
  let settings: any = {};
  try {
    if (fs.existsSync(settingsFile)) {
      settings = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
    }
  } catch {}
  settings.clientId = clientId;
  fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), 'utf-8');
}

function loadCache(): string | undefined {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return fs.readFileSync(CACHE_FILE, 'utf-8');
    }
  } catch {}
  return undefined;
}

function saveCache(cache: string) {
  const dir = path.dirname(CACHE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CACHE_FILE, cache, 'utf-8');
}

function ensurePca(clientId: string): PublicClientApplication {
  const msalConfig: Configuration = {
    auth: {
      clientId,
      authority: 'https://login.microsoftonline.com/common',
    },
  };

  pca = new PublicClientApplication(msalConfig);

  // Load cached tokens
  const cached = loadCache();
  if (cached) {
    pca.getTokenCache().deserialize(cached);
  }

  return pca;
}

function openAuthWindow(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const authWin = new BrowserWindow({
      width: 500,
      height: 700,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    authWin.loadURL(url);

    // Capture redirect with auth code
    authWin.webContents.on('will-redirect', (_event: any, responseUrl: string) => {
      try {
        const parsed = new URL(responseUrl);
        const code = parsed.searchParams.get('code');
        if (code) {
          resolve(code);
          authWin.close();
          return;
        }
        const error = parsed.searchParams.get('error');
        if (error) {
          reject(
            new Error(
              parsed.searchParams.get('error_description') || error
            )
          );
          authWin.close();
        }
      } catch {}
    });

    authWin.on('closed', () => {
      reject(new Error('Authentication window was closed'));
    });
  });
}

export async function graphLogin(clientId: string): Promise<{ success: boolean; account?: string; error?: string }> {
  try {
    saveClientId(clientId);
    const client = ensurePca(clientId);

    const cryptoProvider = new CryptoProvider();
    const { verifier, challenge } = await cryptoProvider.generatePkceCodes();

    const authCodeUrl = await client.getAuthCodeUrl({
      scopes: SCOPES,
      redirectUri: REDIRECT_URI,
      codeChallenge: challenge,
      codeChallengeMethod: 'S256',
    });

    const code = await openAuthWindow(authCodeUrl);

    const result = await client.acquireTokenByCode({
      code,
      scopes: SCOPES,
      redirectUri: REDIRECT_URI,
      codeVerifier: verifier,
    });

    // Save token cache
    saveCache(client.getTokenCache().serialize());

    return {
      success: true,
      account: result.account?.username || result.account?.name || 'Connected',
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Authentication failed' };
  }
}

async function getAccessToken(): Promise<string | null> {
  const clientId = getClientId();
  if (!clientId || !pca) {
    if (clientId) ensurePca(clientId);
    else return null;
  }
  if (!pca) return null;

  const accounts = await pca.getTokenCache().getAllAccounts();
  if (accounts.length === 0) return null;

  try {
    const result = await pca.acquireTokenSilent({
      scopes: SCOPES,
      account: accounts[0],
    });
    saveCache(pca.getTokenCache().serialize());
    return result.accessToken;
  } catch {
    return null;
  }
}

function detectDocType(name: string, mimeType?: string): GraphDoc['type'] {
  const lower = name.toLowerCase();
  if (lower.match(/\.docx?$/) || mimeType?.includes('word')) return 'doc';
  if (lower.match(/\.pptx?$/) || mimeType?.includes('presentation') || mimeType?.includes('powerpoint'))
    return 'ppt';
  if (lower.match(/\.xlsx?$/) || mimeType?.includes('spreadsheet') || mimeType?.includes('excel'))
    return 'xls';
  if (lower.match(/\.pdf$/) || mimeType?.includes('pdf')) return 'pdf';
  return 'other';
}

function detectDocSource(webUrl: string): GraphDoc['source'] {
  const lower = (webUrl || '').toLowerCase();
  if (lower.includes('-my.sharepoint.com') || lower.includes('onedrive')) return 'onedrive';
  if (lower.includes('sharepoint.com')) return 'sharepoint';
  return 'other';
}

async function callGraphApi(endpoint: string, token: string): Promise<any> {
  const response = await fetch(`https://graph.microsoft.com/v1.0${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Graph API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function graphGetRecentDocs(): Promise<GraphDoc[]> {
  const token = await getAccessToken();
  if (!token) return [];

  try {
    const data = await callGraphApi('/me/drive/recent?$top=50', token);
    const items = data.value || [];

    return items.map((item: any) => ({
      title: item.name?.replace(/\.[^.]+$/, '') || 'Untitled',
      url: item.webUrl || '',
      type: detectDocType(item.name || '', item.file?.mimeType),
      source: detectDocSource(item.webUrl || ''),
      sharedBy: item.createdBy?.user?.displayName || '',
      lastModified: item.lastModifiedDateTime,
    }));
  } catch (err) {
    console.error('Failed to fetch recent docs from Graph:', err);
    return [];
  }
}

export async function graphGetSharedDocs(): Promise<GraphDoc[]> {
  const token = await getAccessToken();
  if (!token) return [];

  try {
    const data = await callGraphApi('/me/drive/sharedWithMe?$top=50', token);
    const items = data.value || [];

    return items.map((item: any) => ({
      title: item.name?.replace(/\.[^.]+$/, '') || 'Untitled',
      url: item.webUrl || '',
      type: detectDocType(item.name || '', item.file?.mimeType),
      source: detectDocSource(item.webUrl || ''),
      sharedBy: item.shared?.owner?.user?.displayName ||
        item.createdBy?.user?.displayName || '',
      lastModified: item.lastModifiedDateTime,
    }));
  } catch (err) {
    console.error('Failed to fetch shared docs from Graph:', err);
    return [];
  }
}

export async function graphGetAllDocs(): Promise<GraphDoc[]> {
  const [recent, shared] = await Promise.all([
    graphGetRecentDocs(),
    graphGetSharedDocs(),
  ]);

  // Deduplicate by URL
  const seen = new Set<string>();
  const results: GraphDoc[] = [];
  for (const doc of [...shared, ...recent]) {
    const key = doc.url.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      results.push(doc);
    }
  }
  return results;
}

export function graphIsConfigured(): boolean {
  return !!getClientId();
}

export async function graphIsAuthenticated(): Promise<boolean> {
  const token = await getAccessToken();
  return !!token;
}

export function graphLogout() {
  try {
    if (fs.existsSync(CACHE_FILE)) fs.unlinkSync(CACHE_FILE);
  } catch {}
  pca = null;
}
