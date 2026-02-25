import React from 'react';
import {
  makeStyles,
  tokens,
  Button,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  MenuDivider,
  Tooltip,
} from '@fluentui/react-components';
import {
  MoreHorizontal24Regular,
  Pin24Regular,
  Pin24Filled,
  Globe24Regular,
  AppGeneric24Regular,
  Link24Regular,
  Delete24Regular,
  Clock24Regular,
  CalendarClock20Regular,
} from '@fluentui/react-icons';
import { formatDistanceToNow } from 'date-fns';
import { DocItem, SOURCE_LABELS, STATUS_LABELS, STATUS_ORDER } from '../types';
import { FileTypeIcon } from '../utils/fileIcons';
import { StatusBadge } from './StatusBadge';
import { useDocStore } from '../store/useDocStore';

const useStyles = makeStyles({
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '10px 20px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    cursor: 'pointer',
    transition: 'background-color 0.1s',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3Hover,
    },
    ':hover .actions': {
      opacity: 1,
    },
  },
  cardSelected: {
    backgroundColor: tokens.colorNeutralBackground3Selected,
  },
  info: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  title: {
    fontSize: '14px',
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: tokens.colorNeutralForeground1,
  },
  subtitle: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
  },
  dot: {
    color: tokens.colorNeutralForeground4,
  },
  reminderIcon: {
    color: '#E8A317',
    fontSize: '14px',
    marginLeft: '2px',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    flexShrink: 0,
  },
  actionBtn: {
    minWidth: 'unset',
    padding: '4px',
  },
});

/** Extract owner fallback from SharePoint URL if sharedBy is empty */
function extractOwnerFallback(url: string): string {
  if (!url) return '';
  try {
    const u = new URL(url);
    const path = u.pathname;
    const personalMatch = path.match(/\/personal\/([^_/]+)/i);
    if (personalMatch) {
      const alias = personalMatch[1].toLowerCase();
      return alias.charAt(0).toUpperCase() + alias.slice(1);
    }
    const teamMatch = path.match(/\/(teams|sites)\/([^/]+)/i);
    if (teamMatch) return teamMatch[2].replace(/-/g, ' ');
  } catch { /* ignore */ }
  return '';
}

/** Build ms-office protocol URL for opening in desktop app */
function getDesktopAppUrl(url: string, type: string): string | null {
  if (!url || !url.startsWith('http')) return null;
  const protocols: Record<string, string> = {
    doc: 'ms-word',
    xls: 'ms-excel',
    ppt: 'ms-powerpoint',
  };
  const proto = protocols[type];
  if (!proto) return null;
  return `${proto}:ofe|u|${url}`;
}

interface DocCardProps {
  doc: DocItem;
}

export function DocCard({ doc }: DocCardProps) {
  const styles = useStyles();
  const selectedDocId = useDocStore((s) => s.selectedDocId);
  const setSelectedDocId = useDocStore((s) => s.setSelectedDocId);
  const togglePin = useDocStore((s) => s.togglePin);
  const cycleStatus = useDocStore((s) => s.cycleStatus);
  const setStatus = useDocStore((s) => s.setStatus);
  const deleteDoc = useDocStore((s) => s.deleteDoc);
  const setReminderDialogDocId = useDocStore((s) => s.setReminderDialogDocId);

  const isSelected = selectedDocId === doc.id;
  const timeAgo = formatDistanceToNow(new Date(doc.dateAdded), { addSuffix: true });
  const owner = doc.sharedBy || extractOwnerFallback(doc.url);
  const desktopUrl = getDesktopAppUrl(doc.url, doc.type);

  const handleOpenBrowser = () => {
    if (!doc.url) return;
    window.docshelf.openExternal(doc.url).catch(() => {});
  };

  const handleOpenApp = () => {
    if (!desktopUrl) return;
    window.docshelf.openExternal(desktopUrl).catch(() => {});
  };

  const handleCopyLink = () => {
    if (doc.url) navigator.clipboard.writeText(doc.url);
  };

  return (
    <div
      className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
      onClick={() => setSelectedDocId(isSelected ? null : doc.id)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        handleOpenBrowser();
      }}
    >
      <FileTypeIcon type={doc.type} />

      <div className={styles.info}>
        <div className={styles.title}>
          {doc.pinned && <Pin24Filled style={{ fontSize: '12px', color: '#4A9FE5', marginRight: '4px', verticalAlign: 'middle' }} />}
          {doc.title}
        </div>
        <div className={styles.subtitle}>
          {SOURCE_LABELS[doc.source]}
          {owner && (
            <>
              <span className={styles.dot}>&bull;</span>
              {owner}
            </>
          )}
          <span className={styles.dot}>&bull;</span>
          {timeAgo}
          {doc.openIn && (
            <span style={{
              color: '#4CAF50',
              fontSize: '11px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              marginLeft: '2px',
            }}>
              <span style={{ fontSize: '8px' }}>{'\u25CF'}</span>
              Open in {doc.openIn}
            </span>
          )}
          {doc.reminder && (
            <CalendarClock20Regular className={styles.reminderIcon} />
          )}
        </div>
      </div>

      <div className={styles.actions}>
        {doc.url && (
          <>
            <Tooltip content="Open in browser" relationship="label">
              <Button
                className={styles.actionBtn}
                appearance="subtle"
                size="small"
                icon={<Globe24Regular />}
                onClick={(e) => { e.stopPropagation(); handleOpenBrowser(); }}
              />
            </Tooltip>
            {desktopUrl && (
              <Tooltip content="Open in desktop app" relationship="label">
                <Button
                  className={styles.actionBtn}
                  appearance="subtle"
                  size="small"
                  icon={<AppGeneric24Regular />}
                  onClick={(e) => { e.stopPropagation(); handleOpenApp(); }}
                />
              </Tooltip>
            )}
          </>
        )}

        <StatusBadge status={doc.status} onClick={() => cycleStatus(doc.id)} />

        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Button
              appearance="subtle"
              size="small"
              icon={<MoreHorizontal24Regular />}
              onClick={(e) => e.stopPropagation()}
            />
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem icon={<Globe24Regular />} onClick={handleOpenBrowser}>
                Open in Browser
              </MenuItem>
              {desktopUrl && (
                <MenuItem icon={<AppGeneric24Regular />} onClick={handleOpenApp}>
                  Open in App
                </MenuItem>
              )}
              <MenuItem icon={<Link24Regular />} onClick={handleCopyLink}>
                Copy Link
              </MenuItem>
              <MenuDivider />
              <MenuItem
                icon={doc.pinned ? <Pin24Filled /> : <Pin24Regular />}
                onClick={() => togglePin(doc.id)}
              >
                {doc.pinned ? 'Unpin' : 'Pin to top'}
              </MenuItem>
              <MenuDivider />
              {STATUS_ORDER.map((s) => (
                <MenuItem
                  key={s}
                  onClick={() => setStatus(doc.id, s)}
                  disabled={doc.status === s}
                >
                  {STATUS_LABELS[s]}
                  {doc.status === s ? ' \u2713' : ''}
                </MenuItem>
              ))}
              <MenuDivider />
              <MenuItem
                icon={<Clock24Regular />}
                onClick={() => setReminderDialogDocId(doc.id)}
              >
                {doc.reminder ? 'Change Reminder' : 'Set Reminder'}
              </MenuItem>
              <MenuDivider />
              <MenuItem
                icon={<Delete24Regular />}
                onClick={() => deleteDoc(doc.id)}
              >
                Delete
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      </div>
    </div>
  );
}
