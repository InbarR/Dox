import React from 'react';
import {
  makeStyles,
  tokens,
  Text,
  Button,
  Badge,
  Divider,
} from '@fluentui/react-components';
import {
  DocumentMultiple24Regular,
  Pin24Regular,
  MailUnread24Regular,
  BookOpen24Regular,
  CheckmarkCircle24Regular,
  Warning24Regular,
  Checkmark24Regular,
} from '@fluentui/react-icons';
import { FilterView } from '../types';
import { useDocStore } from '../store/useDocStore';

const useStyles = makeStyles({
  sidebar: {
    width: '220px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  brand: {
    padding: '16px 20px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    '-webkit-app-region': 'drag' as unknown as string,
  },
  brandIcon: {
    fontSize: '22px',
  },
  nav: {
    flex: 1,
    padding: '4px 8px',
    overflowY: 'auto',
  },
  navItem: {
    width: '100%',
    justifyContent: 'flex-start',
    padding: '8px 12px',
    borderRadius: '6px',
    gap: '10px',
    fontWeight: 400,
    minHeight: '36px',
  },
  navItemActive: {
    backgroundColor: tokens.colorNeutralBackground3Selected,
    fontWeight: 600,
  },
  navBadge: {
    marginLeft: 'auto',
    fontSize: '11px',
  },
  sectionLabel: {
    padding: '12px 12px 4px',
    fontSize: '11px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground4,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
});

const NAV_ITEMS: { view: FilterView; label: string; icon: React.ReactElement }[] = [
  { view: 'all', label: 'All Documents', icon: <DocumentMultiple24Regular /> },
  { view: 'pinned', label: 'Pinned', icon: <Pin24Regular /> },
];

const STATUS_NAV: { view: FilterView; label: string; icon: React.ReactElement }[] = [
  { view: 'unread', label: 'Unread', icon: <MailUnread24Regular /> },
  { view: 'reading', label: 'Reading', icon: <BookOpen24Regular /> },
  { view: 'reviewed', label: 'Reviewed', icon: <CheckmarkCircle24Regular /> },
  { view: 'action-needed', label: 'Action Needed', icon: <Warning24Regular /> },
  { view: 'done', label: 'Done', icon: <Checkmark24Regular /> },
];

export function Sidebar() {
  const styles = useStyles();
  const filterView = useDocStore((s) => s.filterView);
  const setFilterView = useDocStore((s) => s.setFilterView);
  const docs = useDocStore((s) => s.docs);

  function getCount(view: FilterView): number {
    if (view === 'all') return docs.length;
    if (view === 'pinned') return docs.filter((d) => d.pinned).length;
    return docs.filter((d) => d.status === view).length;
  }

  return (
    <div className={styles.sidebar}>
      <div className={styles.brand}>
        <Text size={600} weight="bold" style={{ letterSpacing: '1px' }}>
          Dox
        </Text>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const count = getCount(item.view);
          return (
            <Button
              key={item.view}
              appearance="subtle"
              icon={item.icon}
              className={`${styles.navItem} ${
                filterView === item.view ? styles.navItemActive : ''
              }`}
              onClick={() => setFilterView(item.view)}
            >
              {item.label}
              {count > 0 && (
                <span className={styles.navBadge}>{count}</span>
              )}
            </Button>
          );
        })}

        <div className={styles.sectionLabel}>By Status</div>

        {STATUS_NAV.map((item) => {
          const count = getCount(item.view);
          return (
            <Button
              key={item.view}
              appearance="subtle"
              icon={item.icon}
              className={`${styles.navItem} ${
                filterView === item.view ? styles.navItemActive : ''
              }`}
              onClick={() => setFilterView(item.view)}
            >
              {item.label}
              {count > 0 && (
                <span className={styles.navBadge}>{count}</span>
              )}
            </Button>
          );
        })}
      </nav>
    </div>
  );
}
