import React from 'react';
import { makeStyles, tokens, Text } from '@fluentui/react-components';
import {
  DocumentMultiple24Regular,
  Add24Regular,
} from '@fluentui/react-icons';
import { useDocStore } from '../store/useDocStore';
import { DocCard } from './DocCard';

const useStyles = makeStyles({
  container: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '16px',
    color: tokens.colorNeutralForeground4,
    padding: '40px',
  },
  emptyIcon: {
    fontSize: '48px',
    opacity: 0.4,
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground2,
  },
  emptyDesc: {
    fontSize: '14px',
    textAlign: 'center',
    maxWidth: '300px',
    lineHeight: '1.5',
  },
  sectionHeader: {
    padding: '10px 20px 4px',
    fontSize: '12px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground4,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    backgroundColor: tokens.colorNeutralBackground2,
    position: 'sticky' as unknown as 'sticky',
    top: 0,
    zIndex: 1,
  },
});

export function DocList() {
  const styles = useStyles();
  const getFilteredDocs = useDocStore((s) => s.getFilteredDocs);
  const setAddDialogOpen = useDocStore((s) => s.setAddDialogOpen);
  // Subscribe to all state that affects filtering so we re-render on changes
  useDocStore((s) => s.filterView);
  useDocStore((s) => s.filterType);
  useDocStore((s) => s.filterSource);
  useDocStore((s) => s.searchQuery);
  useDocStore((s) => s.sortField);
  useDocStore((s) => s.sortDirection);
  useDocStore((s) => s.docs);
  const docs = getFilteredDocs();

  const pinned = docs.filter((d) => d.pinned);
  const unpinned = docs.filter((d) => !d.pinned);

  if (docs.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <DocumentMultiple24Regular className={styles.emptyIcon} />
          <div className={styles.emptyTitle}>No documents yet</div>
          <div className={styles.emptyDesc}>
            Add your first document by clicking the "Add Document" button above,
            or drag and drop a link onto this window.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {pinned.length > 0 && (
        <>
          <div className={styles.sectionHeader}>
            Pinned ({pinned.length})
          </div>
          {pinned.map((doc) => (
            <DocCard key={doc.id} doc={doc} />
          ))}
        </>
      )}

      {unpinned.length > 0 && (
        <>
          {pinned.length > 0 && (
            <div className={styles.sectionHeader}>
              All Documents ({unpinned.length})
            </div>
          )}
          {unpinned.map((doc) => (
            <DocCard key={doc.id} doc={doc} />
          ))}
        </>
      )}
    </div>
  );
}
