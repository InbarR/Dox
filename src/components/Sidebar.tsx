import React, { useState } from 'react';
import {
  makeStyles,
  tokens,
  Text,
  Button,
  Input,
} from '@fluentui/react-components';
import {
  DocumentMultiple24Regular,
  Pin24Regular,
  BookOpen24Regular,
  Warning24Regular,
  Checkmark24Regular,
  FolderOpen24Regular,
  Add16Regular,
  Dismiss16Regular,
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
  { view: 'open', label: 'Open Now', icon: <BookOpen24Regular /> },
];

const STATUS_NAV: { view: FilterView; label: string; icon: React.ReactElement }[] = [
  { view: 'reading', label: 'In Progress', icon: <BookOpen24Regular /> },
  { view: 'action-needed', label: 'Action Needed', icon: <Warning24Regular /> },
  { view: 'done', label: 'Done', icon: <Checkmark24Regular /> },
];

export function Sidebar() {
  const styles = useStyles();
  const filterView = useDocStore((s) => s.filterView);
  const setFilterView = useDocStore((s) => s.setFilterView);
  const filterCategory = useDocStore((s) => s.filterCategory);
  const setFilterCategory = useDocStore((s) => s.setFilterCategory);
  const categories = useDocStore((s) => s.categories);
  const addCategory = useDocStore((s) => s.addCategory);
  const removeCategory = useDocStore((s) => s.removeCategory);
  const docs = useDocStore((s) => s.docs);
  const [addingCat, setAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  function getCount(view: FilterView): number {
    if (view === 'all') return docs.length;
    if (view === 'pinned') return docs.filter((d) => d.pinned).length;
    if (view === 'open') return docs.filter((d) => !!d.openIn).length;
    return docs.filter((d) => d.status === view).length;
  }

  function getCatCount(cat: string): number {
    return docs.filter((d) => d.category === cat).length;
  }

  function handleAddCategory() {
    const name = newCatName.trim();
    if (name) addCategory(name);
    setNewCatName('');
    setAddingCat(false);
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
              onClick={() => { setFilterView(item.view); setFilterCategory(null); }}
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
              onClick={() => { setFilterView(item.view); setFilterCategory(null); }}
            >
              {item.label}
              {count > 0 && (
                <span className={styles.navBadge}>{count}</span>
              )}
            </Button>
          );
        })}

        <div className={styles.sectionLabel}>Categories</div>

        {categories.map((cat) => (
          <Button
            key={cat}
            appearance="subtle"
            icon={<FolderOpen24Regular />}
            className={`${styles.navItem} ${
              filterCategory === cat ? styles.navItemActive : ''
            }`}
            onClick={() => {
              setFilterCategory(filterCategory === cat ? null : cat);
              setFilterView('all');
            }}
          >
            {cat}
            <span className={styles.navBadge}>{getCatCount(cat)}</span>
          </Button>
        ))}

        {addingCat ? (
          <div style={{ padding: '4px 12px' }}>
            <Input
              size="small"
              placeholder="Category name"
              value={newCatName}
              onChange={(_, data) => setNewCatName(data.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCategory();
                if (e.key === 'Escape') { setAddingCat(false); setNewCatName(''); }
              }}
              onBlur={handleAddCategory}
              autoFocus
              appearance="filled-darker"
            />
          </div>
        ) : (
          <Button
            appearance="subtle"
            icon={<Add16Regular />}
            className={styles.navItem}
            onClick={() => setAddingCat(true)}
            size="small"
          >
            Add Category
          </Button>
        )}
      </nav>
    </div>
  );
}
