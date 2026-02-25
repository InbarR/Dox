import { app, BrowserWindow, ipcMain, shell, Notification } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { scanRecentDocs, scanOpenDocs } from './scanner';
import {
  graphLogin,
  graphGetAllDocs,
  graphIsConfigured,
  graphIsAuthenticated,
  graphLogout,
  saveClientId,
} from './graph';

const DATA_DIR = path.join(app.getPath('userData'), 'docshelf-data');
const DOCS_FILE = path.join(DATA_DIR, 'docs.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadDocs(): unknown[] {
  ensureDataDir();
  if (!fs.existsSync(DOCS_FILE)) {
    fs.writeFileSync(DOCS_FILE, '[]', 'utf-8');
    return [];
  }
  const data = fs.readFileSync(DOCS_FILE, 'utf-8');
  return JSON.parse(data);
}

function saveDocs(docs: unknown[]) {
  ensureDataDir();
  fs.writeFileSync(DOCS_FILE, JSON.stringify(docs, null, 2), 'utf-8');
}

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    backgroundColor: '#0f0f0f',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0f0f0f',
      symbolColor: '#ffffff',
      height: 40,
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.maximize();
    mainWindow?.show();
  });
}

ipcMain.handle('load-docs', () => loadDocs());
ipcMain.handle('save-docs', (_event, docs) => saveDocs(docs));
ipcMain.handle('open-external', async (_event, url: string) => {
  if (!url) return;
  try {
    await shell.openExternal(url);
  } catch (err) {
    console.error('Failed to open URL:', url, err);
  }
});
ipcMain.handle('show-notification', (_event, title, body) => {
  new Notification({ title: title || 'Dox', body }).show();
});
ipcMain.handle('get-data-path', () => DOCS_FILE);

// Scanner IPC
ipcMain.handle('scan-recent-docs', async () => {
  try {
    return await scanRecentDocs();
  } catch (err: any) {
    console.error('Scan failed:', err);
    return [];
  }
});

ipcMain.handle('scan-open-docs', async () => {
  const debugFile = path.join(app.getPath('userData'), 'docshelf-data', 'scan-debug.log');
  try {
    fs.appendFileSync(debugFile, `\n[${new Date().toISOString()}] scan-open-docs called\n`);
  } catch {}
  try {
    const results = await scanOpenDocs();
    try {
      fs.appendFileSync(debugFile, `[${new Date().toISOString()}] Found ${results.length} docs\n`);
    } catch {}
    return results;
  } catch (err: any) {
    try {
      fs.appendFileSync(debugFile, `[${new Date().toISOString()}] ERROR: ${err?.message}\n`);
    } catch {}
    return [];
  }
});

// Graph API IPC
ipcMain.handle('graph-login', async (_event, clientId: string) => {
  return graphLogin(clientId);
});
ipcMain.handle('graph-get-docs', async () => {
  try {
    return await graphGetAllDocs();
  } catch (err: any) {
    console.error('Graph fetch failed:', err);
    return [];
  }
});
ipcMain.handle('graph-is-configured', () => graphIsConfigured());
ipcMain.handle('graph-is-authenticated', () => graphIsAuthenticated());
ipcMain.handle('graph-logout', () => graphLogout());

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
