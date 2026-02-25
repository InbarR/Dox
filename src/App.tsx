import React, { useEffect, useCallback } from 'react';
import {
  FluentProvider,
  webDarkTheme,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { useDocStore } from './store/useDocStore';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';
import { DocList } from './components/DocList';
import { DocDetails } from './components/DocDetails';
import { AddDocDialog } from './components/AddDocDialog';
import { ReminderDialog } from './components/ReminderDialog';
import { ImportDialog } from './components/ImportDialog';
import { detectTypeFromUrl, detectSourceFromUrl } from './utils/fileIcons';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    height: '100vh',
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
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

  const refreshOpenStatus = useDocStore((s) => s.refreshOpenStatus);
  const autoImport = useDocStore((s) => s.autoImport);

  // Load docs on mount, then auto-import new ones and check open status
  useEffect(() => {
    loadDocs().then(() => autoImport().then(() => refreshOpenStatus()));
  }, [loadDocs, autoImport, refreshOpenStatus]);

  // Periodically scan for new docs and refresh open status (every 2 min)
  useEffect(() => {
    const interval = setInterval(() => {
      autoImport().then(() => refreshOpenStatus());
    }, 120000);
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

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        setAddDialogOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setAddDialogOpen]);

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

      const text = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list');
      if (text && text.startsWith('http')) {
        addDoc({
          title: text.split('/').pop()?.split('?')[0] || 'Untitled Document',
          url: text,
          type: detectTypeFromUrl(text),
          source: detectSourceFromUrl(text),
          sharedBy: '',
        });
        return;
      }

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        Array.from(files).forEach((file) => {
          addDoc({
            title: file.name,
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
      {sidebarOpen && <Sidebar />}

      <div className={styles.main}>
        <div className={styles.dragBar} />
        <Toolbar
          onOpenImport={() => setImportDialogOpen(true)}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <div className={styles.body}>
          <DocList />
          {selectedDocId && <DocDetails />}
        </div>
      </div>

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
