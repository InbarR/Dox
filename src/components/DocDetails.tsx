import React, { useState } from 'react';
import {
  makeStyles,
  tokens,
  Text,
  Button,
  Textarea,
  Input,
  Divider,
  Badge,
} from '@fluentui/react-components';
import {
  Dismiss24Regular,
  Open24Regular,
  Pin24Regular,
  Pin24Filled,
  Link24Regular,
  Delete24Regular,
  Clock24Regular,
  Tag24Regular,
  Add16Regular,
} from '@fluentui/react-icons';
import { format, formatDistanceToNow } from 'date-fns';
import { useDocStore } from '../store/useDocStore';
import { SOURCE_LABELS, TYPE_LABELS, STATUS_ORDER, STATUS_LABELS } from '../types';
import { FileTypeIcon } from '../utils/fileIcons';
import { StatusBadge } from './StatusBadge';

const useStyles = makeStyles({
  panel: {
    width: '280px',
    minWidth: '220px',
    flexShrink: 0,
    borderLeft: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  meta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
  },
  metaLabel: {
    color: tokens.colorNeutralForeground4,
  },
  metaValue: {
    color: tokens.colorNeutralForeground1,
    fontWeight: 500,
  },
  actions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground4,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tags: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  tag: {
    cursor: 'pointer',
    ':hover': {
      opacity: 0.7,
    },
  },
  tagInput: {
    maxWidth: '120px',
  },
  reminderInfo: {
    padding: '8px 12px',
    borderRadius: '6px',
    backgroundColor: '#E8A31722',
    color: '#E8A317',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  statusList: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
});

export function DocDetails() {
  const styles = useStyles();
  const selectedDocId = useDocStore((s) => s.selectedDocId);
  const setSelectedDocId = useDocStore((s) => s.setSelectedDocId);
  const docs = useDocStore((s) => s.docs);
  const updateDoc = useDocStore((s) => s.updateDoc);
  const togglePin = useDocStore((s) => s.togglePin);
  const setStatus = useDocStore((s) => s.setStatus);
  const deleteDoc = useDocStore((s) => s.deleteDoc);
  const setReminderDialogDocId = useDocStore((s) => s.setReminderDialogDocId);

  const [tagInput, setTagInput] = useState('');
  const [addingTag, setAddingTag] = useState(false);

  const doc = docs.find((d) => d.id === selectedDocId);
  if (!doc) return null;

  const handleOpen = () => {
    if (doc.url) window.docshelf.openExternal(doc.url);
  };

  const handleCopyLink = () => {
    if (doc.url) navigator.clipboard.writeText(doc.url);
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) {
      setAddingTag(false);
      return;
    }
    const newTags = [...doc.tags, tagInput.trim()];
    updateDoc(doc.id, { tags: newTags });
    setTagInput('');
    setAddingTag(false);
  };

  const handleRemoveTag = (tag: string) => {
    updateDoc(doc.id, { tags: doc.tags.filter((t) => t !== tag) });
  };

  const handleDelete = () => {
    deleteDoc(doc.id);
    setSelectedDocId(null);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <Text weight="semibold" size={300}>
          Document Details
        </Text>
        <Button
          appearance="subtle"
          size="small"
          icon={<Dismiss24Regular />}
          onClick={() => setSelectedDocId(null)}
        />
      </div>

      <div className={styles.content}>
        <div className={styles.titleRow}>
          <FileTypeIcon type={doc.type} />
          <div>
            <Text size={400} weight="bold" block>
              {doc.title}
            </Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground4 }}>
              {TYPE_LABELS[doc.type]} · {SOURCE_LABELS[doc.source]}
            </Text>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <Button size="small" icon={<Open24Regular />} onClick={handleOpen}>
            Open
          </Button>
          <Button size="small" icon={<Link24Regular />} onClick={handleCopyLink}>
            Copy Link
          </Button>
          <Button
            size="small"
            icon={doc.pinned ? <Pin24Filled /> : <Pin24Regular />}
            onClick={() => togglePin(doc.id)}
          >
            {doc.pinned ? 'Unpin' : 'Pin'}
          </Button>
          <Button
            size="small"
            icon={<Clock24Regular />}
            onClick={() => setReminderDialogDocId(doc.id)}
          >
            Reminder
          </Button>
        </div>

        {/* Reminder */}
        {doc.reminder && (
          <div className={styles.reminderInfo}>
            <Clock24Regular />
            Reminder: {format(new Date(doc.reminder), 'PPp')}
          </div>
        )}

        <Divider />

        {/* Status */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Status</div>
          <div className={styles.statusList}>
            {STATUS_ORDER.map((s) => (
              <StatusBadge
                key={s}
                status={s}
                onClick={() => setStatus(doc.id, s)}
              />
            ))}
          </div>
        </div>

        <Divider />

        {/* Metadata */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Details</div>
          <div className={styles.meta}>
            {doc.sharedBy && (
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Shared by</span>
                <span className={styles.metaValue}>{doc.sharedBy}</span>
              </div>
            )}
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Added</span>
              <span className={styles.metaValue}>
                {formatDistanceToNow(new Date(doc.dateAdded), { addSuffix: true })}
              </span>
            </div>
            {doc.dateModified && (
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Modified</span>
                <span className={styles.metaValue}>
                  {formatDistanceToNow(new Date(doc.dateModified), { addSuffix: true })}
                </span>
              </div>
            )}
          </div>
        </div>

        <Divider />

        {/* Tags */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Tags</div>
          <div className={styles.tags}>
            {doc.tags.map((tag) => (
              <Badge
                key={tag}
                appearance="outline"
                className={styles.tag}
                onClick={() => handleRemoveTag(tag)}
                title="Click to remove"
              >
                {tag} ×
              </Badge>
            ))}
            {addingTag ? (
              <Input
                className={styles.tagInput}
                size="small"
                value={tagInput}
                onChange={(_, data) => setTagInput(data.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTag();
                  if (e.key === 'Escape') {
                    setAddingTag(false);
                    setTagInput('');
                  }
                }}
                onBlur={handleAddTag}
                placeholder="Tag name"
                autoFocus
                appearance="filled-darker"
              />
            ) : (
              <Button
                size="small"
                appearance="subtle"
                icon={<Add16Regular />}
                onClick={() => setAddingTag(true)}
              >
                Add tag
              </Button>
            )}
          </div>
        </div>

        <Divider />

        {/* Notes */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Notes</div>
          <Textarea
            value={doc.notes}
            onChange={(_, data) => updateDoc(doc.id, { notes: data.value })}
            placeholder="Add personal notes..."
            resize="vertical"
            rows={4}
            appearance="filled-darker"
          />
        </div>

        <Divider />

        <Button
          appearance="secondary"
          icon={<Delete24Regular />}
          onClick={handleDelete}
          style={{ color: '#E85D4A' }}
        >
          Delete Document
        </Button>
      </div>
    </div>
  );
}
