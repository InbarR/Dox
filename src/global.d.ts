import { DocItem } from './types';

interface ScannedDoc {
  title: string;
  path: string;
  type: 'doc' | 'ppt' | 'xls' | 'pdf' | 'other';
  source: 'sharepoint' | 'onedrive' | 'local' | 'teams' | 'other';
  app?: string;
  owner?: string;
}

interface GraphDoc {
  title: string;
  url: string;
  type: 'doc' | 'ppt' | 'xls' | 'pdf' | 'other';
  source: 'sharepoint' | 'onedrive' | 'other';
  sharedBy: string;
  lastModified?: string;
}

interface GraphLoginResult {
  success: boolean;
  account?: string;
  error?: string;
}

declare global {
  interface Window {
    docshelf: {
      loadDocs: () => Promise<DocItem[]>;
      saveDocs: (docs: DocItem[]) => Promise<void>;
      openExternal: (url: string) => Promise<void>;
      showNotification: (title: string, body: string) => Promise<void>;
      getDataPath: () => Promise<string>;

      scanRecentDocs: () => Promise<ScannedDoc[]>;
      scanOpenDocs: () => Promise<ScannedDoc[]>;
      scanBrowserTabs: () => Promise<Array<{ title: string; type: string }>>;

      chatSend: (messages: Array<{ role: string; content: string }>) =>
        Promise<{ ok?: boolean; reply?: string; error?: string }>;

      graphLogin: (clientId: string) => Promise<GraphLoginResult>;
      graphGetDocs: () => Promise<GraphDoc[]>;
      graphIsConfigured: () => Promise<boolean>;
      graphIsAuthenticated: () => Promise<boolean>;
      graphLogout: () => Promise<void>;
    };
  }
}

export {};
