import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Button,
  Input,
  Text,
  Checkbox,
  Spinner,
  TabList,
  Tab,
  makeStyles,
  tokens,
  Field,
  Badge,
} from '@fluentui/react-components';
import {
  Dismiss24Regular,
  DesktopArrowRight24Regular,
  Cloud24Regular,
  ArrowSync24Regular,
  CheckmarkCircle24Regular,
} from '@fluentui/react-icons';
import { useDocStore } from '../store/useDocStore';
import { FileTypeIcon } from '../utils/fileIcons';
import { DocType, DocSource } from '../types';

const useStyles = makeStyles({
  tabs: {
    marginBottom: '16px',
  },
  list: {
    maxHeight: '400px',
    overflowY: 'auto',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: '6px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    ':last-child': {
      borderBottom: 'none',
    },
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontSize: '13px',
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemMeta: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0',
  },
  selectActions: {
    display: 'flex',
    gap: '8px',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    gap: '12px',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px',
    gap: '8px',
    color: tokens.colorNeutralForeground4,
  },
  graphSetup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '16px 0',
  },
  infoBox: {
    padding: '12px 16px',
    borderRadius: '6px',
    backgroundColor: tokens.colorNeutralBackground3,
    fontSize: '12px',
    lineHeight: '1.6',
    color: tokens.colorNeutralForeground3,
  },
  connectedBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: '6px',
    backgroundColor: '#107C4122',
    color: '#4CAF50',
    fontSize: '13px',
  },
  alreadyImported: {
    opacity: 0.5,
  },
  scanPrompt: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '32px',
    gap: '10px',
    color: tokens.colorNeutralForeground4,
    textAlign: 'center',
  },
  scanIcon: {
    fontSize: '36px',
    marginBottom: '4px',
  },
});

interface ImportItem {
  id: string;
  title: string;
  path: string;
  type: DocType;
  source: DocSource;
  sharedBy: string;
  selected: boolean;
  alreadyExists: boolean;
}

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
}

const SOURCE_LABELS: Record<string, string> = {
  sharepoint: 'SharePoint',
  onedrive: 'OneDrive',
  teams: 'Teams',
  local: 'Local',
  email: 'Email',
  other: 'Other',
};

export function ImportDialog({ open, onClose }: ImportDialogProps) {
  const styles = useStyles();
  const addDoc = useDocStore((s) => s.addDoc);
  const existingDocs = useDocStore((s) => s.docs);

  const [tab, setTab] = useState<string>('open');
  const [items, setItems] = useState<ImportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);

  // Graph state
  const [graphAuthenticated, setGraphAuthenticated] = useState(false);
  const [clientId, setClientId] = useState('');
  const [graphLoggingIn, setGraphLoggingIn] = useState(false);
  const [graphAccount, setGraphAccount] = useState('');
  const [graphError, setGraphError] = useState('');

  useEffect(() => {
    if (open) {
      setItems([]);
      setScanned(false);
      setGraphError('');
      setTab('all');
      checkGraphAuth();
      handleScanAll();
    }
  }, [open]);

  const checkGraphAuth = async () => {
    try {
      const authed = await window.docshelf.graphIsAuthenticated();
      setGraphAuthenticated(authed);
    } catch {}
  };

  const isAlreadyImported = (path: string, title: string): boolean => {
    if (!path && !title) return false;
    const pathLower = path.toLowerCase().replace(/\\/g, '/');
    const titleLower = title.toLowerCase();
    return existingDocs.some((d) => {
      if (path && d.url) {
        return d.url.toLowerCase().replace(/\\/g, '/') === pathLower;
      }
      return d.title.toLowerCase() === titleLower;
    });
  };

  const toImportItems = (
    docs: Array<{ title: string; path: string; type: string; source: string; sharedBy?: string }>,
    prefix: string
  ): ImportItem[] => {
    return docs.map((doc, i) => {
      const exists = isAlreadyImported(doc.path, doc.title);
      return {
        id: `${prefix}-${i}`,
        title: doc.title,
        path: doc.path,
        type: doc.type as DocType,
        source: doc.source as DocSource,
        sharedBy: doc.sharedBy || '',
        selected: !exists,
        alreadyExists: exists,
      };
    });
  };

  // Scan open + recent documents combined
  const handleScanAll = async () => {
    setLoading(true);
    setItems([]);
    try {
      const [openDocs, recentDocs] = await Promise.all([
        window.docshelf.scanOpenDocs(),
        window.docshelf.scanRecentDocs(),
      ]);
      // Merge and deduplicate (open docs first, then recent)
      const seen = new Set<string>();
      const merged: Array<{ title: string; path: string; type: string; source: string; sharedBy?: string }> = [];
      for (const doc of [...openDocs, ...recentDocs]) {
        const key = (doc.path || doc.title).toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          merged.push({ title: doc.title, path: doc.path, type: doc.type, source: doc.source });
        }
      }
      setItems(toImportItems(merged, 'all'));
      setScanned(true);
    } catch (err) {
      console.error('Scan failed:', err);
      setScanned(true);
    } finally {
      setLoading(false);
    }
  };

  // Graph login
  const handleGraphLogin = async () => {
    if (!clientId.trim()) return;
    setGraphLoggingIn(true);
    setGraphError('');
    try {
      const result = await window.docshelf.graphLogin(clientId.trim());
      if (result.success) {
        setGraphAuthenticated(true);
        setGraphAccount(result.account || '');
      } else {
        setGraphError(result.error || 'Login failed');
      }
    } catch (err: any) {
      setGraphError(err.message || 'Login failed');
    } finally {
      setGraphLoggingIn(false);
    }
  };

  // Graph fetch
  const handleFetchGraph = async () => {
    setLoading(true);
    setItems([]);
    try {
      const docs = await window.docshelf.graphGetDocs();
      setItems(
        toImportItems(
          docs.map((d) => ({
            title: d.title,
            path: d.url,
            type: d.type,
            source: d.source,
            sharedBy: d.sharedBy,
          })),
          'graph'
        )
      );
      setScanned(true);
    } catch (err) {
      console.error('Graph fetch failed:', err);
      setScanned(true);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id && !item.alreadyExists
          ? { ...item, selected: !item.selected }
          : item
      )
    );
  };

  const handleSelectAll = () => {
    setItems((prev) =>
      prev.map((item) =>
        item.alreadyExists ? item : { ...item, selected: true }
      )
    );
  };

  const handleDeselectAll = () => {
    setItems((prev) => prev.map((item) => ({ ...item, selected: false })));
  };

  const handleImport = () => {
    const selected = items.filter((item) => item.selected && !item.alreadyExists);
    for (const item of selected) {
      addDoc({
        title: item.title,
        url: item.path,
        type: item.type,
        source: item.source,
        sharedBy: item.sharedBy,
      });
    }
    onClose();
  };

  const selectedCount = items.filter((i) => i.selected && !i.alreadyExists).length;

  const getRescanHandler = () => {
    if (tab === 'all') return handleScanAll;
    return handleFetchGraph;
  };

  const getLoadingText = () => {
    if (tab === 'all') return 'Scanning open and recent documents...';
    return 'Fetching from Microsoft 365...';
  };

  // Shared results view
  const renderResults = () => {
    if (loading) {
      return (
        <div className={styles.loading}>
          <Spinner size="medium" />
          <Text size={300}>{getLoadingText()}</Text>
        </div>
      );
    }

    if (scanned && items.length === 0) {
      return (
        <div className={styles.empty}>
          <Text size={400} weight="semibold">
            No documents found
          </Text>
          <Text size={200}>
            {tab === 'all'
              ? 'No Office or PDF documents found on this PC.'
              : 'No documents found in your Microsoft 365 account.'}
          </Text>
        </div>
      );
    }

    if (scanned && items.length > 0) {
      return (
        <>
          <div className={styles.statusBar}>
            <Text size={200}>
              Found {items.length} document{items.length !== 1 ? 's' : ''} ({selectedCount} selected)
            </Text>
            <div className={styles.selectActions}>
              <Button size="small" appearance="subtle" onClick={handleSelectAll}>
                Select All
              </Button>
              <Button size="small" appearance="subtle" onClick={handleDeselectAll}>
                Deselect All
              </Button>
              <Button
                size="small"
                appearance="subtle"
                icon={<ArrowSync24Regular />}
                onClick={getRescanHandler()}
              >
                Rescan
              </Button>
            </div>
          </div>

          <div className={styles.list}>
            {items.map((item) => (
              <div
                key={item.id}
                className={`${styles.item} ${
                  item.alreadyExists ? styles.alreadyImported : ''
                }`}
              >
                <Checkbox
                  checked={item.selected}
                  onChange={() => handleToggle(item.id)}
                  disabled={item.alreadyExists}
                />
                <FileTypeIcon type={item.type} />
                <div className={styles.itemInfo}>
                  <div className={styles.itemTitle}>
                    {item.title}
                    {item.alreadyExists && (
                      <Badge
                        appearance="outline"
                        size="small"
                        style={{ marginLeft: '8px' }}
                      >
                        Already imported
                      </Badge>
                    )}
                  </div>
                  <div className={styles.itemMeta}>
                    {SOURCE_LABELS[item.source] || item.source}
                    {item.sharedBy && ` · ${item.sharedBy}`}
                    {item.path && !item.path.startsWith('http') && item.path.length < 80 && (
                      <> · {item.path}</>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface style={{ maxWidth: '680px', width: '100%' }}>
        <DialogTitle
          action={
            <Button
              appearance="subtle"
              icon={<Dismiss24Regular />}
              onClick={onClose}
            />
          }
        >
          Import Documents
        </DialogTitle>
        <DialogBody>
          <DialogContent>
            <TabList
              className={styles.tabs}
              selectedValue={tab}
              onTabSelect={(_, data) => {
                const newTab = data.value as string;
                setTab(newTab);
                setItems([]);
                setScanned(false);
                if (newTab === 'all') handleScanAll();
              }}
            >
              <Tab icon={<DesktopArrowRight24Regular />} value="all">
                My Documents
              </Tab>
              <Tab icon={<Cloud24Regular />} value="graph">
                Microsoft 365
              </Tab>
            </TabList>

            {tab === 'all' && renderResults()}

            {/* Graph tab - needs setup first */}
            {tab === 'graph' && (
              <>
                {!scanned && !loading && (
                  <div className={styles.graphSetup}>
                    {graphAuthenticated ? (
                      <>
                        <div className={styles.connectedBadge}>
                          <CheckmarkCircle24Regular />
                          Connected to Microsoft 365
                          {graphAccount && ` (${graphAccount})`}
                        </div>
                        <Button
                          appearance="primary"
                          icon={<ArrowSync24Regular />}
                          onClick={handleFetchGraph}
                        >
                          Fetch Documents from M365
                        </Button>
                        <Button
                          appearance="subtle"
                          size="small"
                          onClick={async () => {
                            await window.docshelf.graphLogout();
                            setGraphAuthenticated(false);
                            setGraphAccount('');
                          }}
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className={styles.infoBox}>
                          To connect Microsoft 365, you need an Azure AD app
                          registration:
                          <br />
                          1. Go to{' '}
                          <strong>portal.azure.com &gt; App registrations</strong>
                          <br />
                          2. Create a new registration with redirect URI:{' '}
                          <code>http://localhost</code> (Mobile/Desktop)
                          <br />
                          3. Add API permissions: <strong>Files.Read.All</strong>,{' '}
                          <strong>Sites.Read.All</strong>,{' '}
                          <strong>User.Read</strong> (delegated)
                          <br />
                          4. Copy the <strong>Application (client) ID</strong> and
                          paste below.
                        </div>
                        <Field label="Application (Client) ID">
                          <Input
                            value={clientId}
                            onChange={(_, data) => setClientId(data.value)}
                            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                            appearance="filled-darker"
                          />
                        </Field>
                        {graphError && (
                          <Text size={200} style={{ color: '#E85D4A' }}>
                            {graphError}
                          </Text>
                        )}
                        <Button
                          appearance="primary"
                          icon={<Cloud24Regular />}
                          onClick={handleGraphLogin}
                          disabled={!clientId.trim() || graphLoggingIn}
                        >
                          {graphLoggingIn ? 'Signing in...' : 'Connect Microsoft 365'}
                        </Button>
                      </>
                    )}
                  </div>
                )}
                {(scanned || loading) && renderResults()}
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose}>
              Cancel
            </Button>
            {scanned && selectedCount > 0 && (
              <Button appearance="primary" onClick={handleImport}>
                Import {selectedCount} Document{selectedCount !== 1 ? 's' : ''}
              </Button>
            )}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
