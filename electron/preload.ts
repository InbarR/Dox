import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('docshelf', {
  // Doc persistence
  loadDocs: () => ipcRenderer.invoke('load-docs'),
  saveDocs: (docs: unknown[]) => ipcRenderer.invoke('save-docs', docs),

  // Shell
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  showNotification: (title: string, body: string) =>
    ipcRenderer.invoke('show-notification', title, body),
  getDataPath: () => ipcRenderer.invoke('get-data-path'),

  // Scanner
  scanRecentDocs: () => ipcRenderer.invoke('scan-recent-docs'),
  scanOpenDocs: () => ipcRenderer.invoke('scan-open-docs'),
  scanBrowserTabs: () => ipcRenderer.invoke('scan-browser-tabs'),

  // AI Chat
  chatSend: (messages: Array<{ role: string; content: string }>) =>
    ipcRenderer.invoke('chat-send', messages),

  // Graph API
  graphLogin: (clientId: string) => ipcRenderer.invoke('graph-login', clientId),
  graphGetDocs: () => ipcRenderer.invoke('graph-get-docs'),
  graphIsConfigured: () => ipcRenderer.invoke('graph-is-configured'),
  graphIsAuthenticated: () => ipcRenderer.invoke('graph-is-authenticated'),
  graphLogout: () => ipcRenderer.invoke('graph-logout'),
});
