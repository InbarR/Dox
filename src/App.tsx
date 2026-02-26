import React, { useEffect, useCallback } from 'react';
import {
  FluentProvider,
  webDarkTheme,
  makeStyles,
  tokens,
  Button,
} from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';
import { useDocStore } from './store/useDocStore';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';
import { DocList } from './components/DocList';
import { DocDetails } from './components/DocDetails';
import { AddDocDialog } from './components/AddDocDialog';
import { ReminderDialog } from './components/ReminderDialog';
import { ImportDialog } from './components/ImportDialog';
import { ChatPanel } from './components/ChatPanel';
import { FileTypeIcon, detectTypeFromUrl, detectSourceFromUrl } from './utils/fileIcons';
import { SOURCE_LABELS } from './types';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
  },
  topRow: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  body: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  listColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    overflow: 'hidden',
  },
  detailsBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '8px 20px',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    flexShrink: 0,
    fontSize: '13px',
  },
  detailsTitle: {
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  detailsMeta: {
    color: tokens.colorNeutralForeground4,
    whiteSpace: 'nowrap',
  },
  detailsActions: {
    display: 'flex',
    gap: '4px',
    marginLeft: 'auto',
    flexShrink: 0,
  },
  dragBar: {
    height: '40px',
    '-webkit-app-region': 'drag' as unknown as string,
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '16px',
    flexShrink: 0,
    fontSize: '12px',
    color: tokens.colorNeutralForeground4,
  },
  dropOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(74, 159, 229, 0.15)',
    border: '3px dashed #4A9FE5',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: 600,
    color: '#4A9FE5',
    zIndex: 9999,
    pointerEvents: 'none',
  },
});

function BottomDetailsBar() {
  const styles = useStyles();
  const docs = useDocStore((s) => s.docs);
  const selectedDocId = useDocStore((s) => s.selectedDocId);
  const setSelectedDocId = useDocStore((s) => s.setSelectedDocId);
  const togglePin = useDocStore((s) => s.togglePin);
  const setReminderDialogDocId = useDocStore((s) => s.setReminderDialogDocId);
  const doc = docs.find((d) => d.id === selectedDocId);
  if (!doc) return null;

  return (
    <div className={styles.detailsBar}>
      <FileTypeIcon type={doc.type} />
      <span className={styles.detailsTitle}>{doc.title}</span>
      <span className={styles.detailsMeta}>
        {SOURCE_LABELS[doc.source]}
        {doc.sharedBy && ` · ${doc.sharedBy}`}
      </span>
      <div className={styles.detailsActions}>
        {doc.url && (
          <Button size="small" appearance="subtle" onClick={() => window.docshelf.openExternal(doc.url)}>
            Open
          </Button>
        )}
        {doc.url && (
          <Button size="small" appearance="subtle" onClick={() => navigator.clipboard.writeText(doc.url)}>
            Copy Link
          </Button>
        )}
        <Button size="small" appearance="subtle" onClick={() => togglePin(doc.id)}>
          {doc.pinned ? 'Unpin' : 'Pin'}
        </Button>
        <Button
          size="small"
          appearance="subtle"
          icon={<Dismiss24Regular />}
          onClick={() => setSelectedDocId(null)}
        />
      </div>
    </div>
  );
}

function AppContent() {
  const styles = useStyles();
  const loadDocs = useDocStore((s) => s.loadDocs);
  const docs = useDocStore((s) => s.docs);
  const setReminder = useDocStore((s) => s.setReminder);
  const selectedDocId = useDocStore((s) => s.selectedDocId);
  const setAddDialogOpen = useDocStore((s) => s.setAddDialogOpen);
  const addDoc = useDocStore((s) => s.addDoc);
  const [isDragging, setIsDragging] = React.useState(false);
  const [importDialogOpen, setImportDialogOpen] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [chatOpen, setChatOpen] = React.useState(false);

  const refreshOpenStatus = useDocStore((s) => s.refreshOpenStatus);
  const autoImport = useDocStore((s) => s.autoImport);

  // Load docs on mount, then auto-import new ones and check open status
  useEffect(() => {
    loadDocs().then(() => autoImport().then(() => refreshOpenStatus()));
  }, [loadDocs, autoImport, refreshOpenStatus]);

  // Periodically scan for new docs and refresh open status (every 15s)
  useEffect(() => {
    const interval = setInterval(() => {
      autoImport().then(() => refreshOpenStatus());
    }, 15000);
    return () => clearInterval(interval);
  }, [autoImport, refreshOpenStatus]);

  // Reminder checker
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      docs.forEach((doc) => {
        if (doc.reminder && new Date(doc.reminder) <= now) {
          window.docshelf.showNotification(
            'Dox Reminder',
            `Time to check: ${doc.title}`
          );
          setReminder(doc.id, undefined);
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [docs, setReminder]);

  const getFilteredDocs = useDocStore((s) => s.getFilteredDocs);
  const setSelectedDocId = useDocStore((s) => s.setSelectedDocId);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        setAddDialogOpen(true);
        return;
      }

      // Arrow key navigation through document list (skip if in an input)
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        const filteredDocs = getFilteredDocs();
        if (filteredDocs.length === 0) return;

        const currentId = useDocStore.getState().selectedDocId;
        const currentIdx = currentId
          ? filteredDocs.findIndex((d) => d.id === currentId)
          : -1;

        let nextIdx: number;
        if (e.key === 'ArrowDown') {
          nextIdx = currentIdx < filteredDocs.length - 1 ? currentIdx + 1 : 0;
        } else {
          nextIdx = currentIdx > 0 ? currentIdx - 1 : filteredDocs.length - 1;
        }

        e.preventDefault();
        setSelectedDocId(filteredDocs[nextIdx].id);

        // Scroll the selected item into view
        setTimeout(() => {
          const el = document.querySelector(`[data-doc-id="${filteredDocs[nextIdx].id}"]`);
          el?.scrollIntoView({ block: 'nearest' });
        }, 0);
      }

      // Enter opens the selected doc
      if (e.key === 'Enter' && !e.ctrlKey) {
        const currentId = useDocStore.getState().selectedDocId;
        if (currentId) {
          const doc = useDocStore.getState().docs.find((d) => d.id === currentId);
          if (doc?.url) {
            e.preventDefault();
            window.docshelf.openExternal(doc.url).catch(() => {});
          }
        }
      }

      // Ctrl+V paste a URL to add a doc
      if (e.ctrlKey && e.key === 'v') {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;

        (async () => {
          try {
            // Try HTML first for rich link text
            let title = '';
            try {
              const items = await navigator.clipboard.read();
              for (const item of items) {
                if (item.types.includes('text/html')) {
                  const blob = await item.getType('text/html');
                  const html = await blob.text();
                  const match = html.match(/<a[^>]*>([^<]+)<\/a>/i);
                  if (match) title = match[1].replace(/\.[^.]+$/, '').trim();
                }
              }
            } catch {}

            const text = await navigator.clipboard.readText();
            const trimmed = text.trim();
            if (!trimmed.startsWith('http')) return;

            const existingDocs = useDocStore.getState().docs;
            const exists = existingDocs.some(
              (d) => d.url.toLowerCase() === trimmed.toLowerCase()
            );
            if (exists) return;

            if (!title) {
              try {
                const u = new URL(trimmed);
                const parts = u.pathname.split('/');
                const fname = parts[parts.length - 1];
                if (fname && !fname.match(/^[A-Za-z0-9_-]{20,}$/)) {
                  title = decodeURIComponent(fname).replace(/\.[^.]+$/, '').replace(/%20/g, ' ');
                }
                if (!title) {
                  const file = u.searchParams.get('file') || u.searchParams.get('sourcedoc');
                  if (file) title = decodeURIComponent(file).replace(/\.[^.]+$/, '');
                }
              } catch {}
            }
            if (!title) title = 'Untitled Document';

            const type = detectTypeFromUrl(title) !== 'other'
              ? detectTypeFromUrl(title)
              : detectTypeFromUrl(trimmed);

            addDoc({
              title,
              url: trimmed,
              type,
              source: detectSourceFromUrl(trimmed),
              sharedBy: '',
            });
          } catch {}
        })();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setAddDialogOpen, getFilteredDocs, setSelectedDocId, addDoc]);

  // Drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (e.relatedTarget === null || !e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      // Try to get the link text from HTML (e.g. dragged from Teams/browser)
      const html = e.dataTransfer.getData('text/html');
      const url = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list');

      if (url && url.trim().startsWith('http')) {
        const trimmedUrl = url.trim();

        // Extract title: prefer HTML anchor text, then URL filename
        let title = '';
        if (html) {
          // Parse anchor text from HTML like <a href="...">Readable Title.docx</a>
          const match = html.match(/<a[^>]*>([^<]+)<\/a>/i);
          if (match) {
            title = match[1].replace(/\.[^.]+$/, '').trim();
          }
        }
        if (!title) {
          // Try to get a readable name from the URL path
          try {
            const u = new URL(trimmedUrl);
            const parts = u.pathname.split('/');
            const fname = parts[parts.length - 1];
            if (fname && !fname.match(/^[A-Za-z0-9_-]{20,}$/)) {
              // Only use if it looks like a real filename, not an encoded ID
              title = decodeURIComponent(fname).replace(/\.[^.]+$/, '').replace(/%20/g, ' ');
            }
          } catch {}
        }
        if (!title) {
          // For encoded SharePoint URLs, try query params
          try {
            const u = new URL(trimmedUrl);
            const file = u.searchParams.get('file') || u.searchParams.get('sourcedoc');
            if (file) {
              title = decodeURIComponent(file).replace(/\.[^.]+$/, '');
            }
          } catch {}
        }
        if (!title) title = 'Untitled Document';

        // Check for duplicates by URL or title
        const docs = useDocStore.getState().docs;
        const dup = docs.some(
          (d) =>
            d.url.toLowerCase() === trimmedUrl.toLowerCase() ||
            d.title.toLowerCase() === title.toLowerCase()
        );
        if (dup) return;

        // Detect type from title (might have .docx) or URL
        const type = detectTypeFromUrl(title) !== 'other'
          ? detectTypeFromUrl(title)
          : detectTypeFromUrl(trimmedUrl);

        addDoc({
          title,
          url: trimmedUrl,
          type,
          source: detectSourceFromUrl(trimmedUrl),
          sharedBy: '',
        });
        return;
      }

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        Array.from(files).forEach((file) => {
          addDoc({
            title: file.name.replace(/\.[^.]+$/, ''),
            url: '',
            type: detectTypeFromUrl(file.name),
            source: 'local',
            sharedBy: '',
          });
        });
      }
    },
    [addDoc]
  );

  return (
    <div
      className={styles.root}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={styles.topRow}>
        {sidebarOpen && <Sidebar />}

        <div className={styles.main}>
          <div className={styles.dragBar} />
          <Toolbar
            onOpenImport={() => setImportDialogOpen(true)}
            onRefresh={() => autoImport().then(() => refreshOpenStatus())}
            onToggleChat={() => setChatOpen(!chatOpen)}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
          <div className={styles.body}>
            <DocList />
            {selectedDocId && !chatOpen && <DocDetails />}
            {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}
          </div>
        </div>
      </div>

      {selectedDocId && chatOpen && (
        <BottomDetailsBar />
      )}

      {isDragging && (
        <div className={styles.dropOverlay}>
          Drop document link here
        </div>
      )}

      <AddDocDialog />
      <ReminderDialog />
      <ImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <FluentProvider theme={webDarkTheme}>
      <AppContent />
    </FluentProvider>
  );
}
