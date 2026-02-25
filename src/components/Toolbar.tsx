import React from 'react';
import {
  makeStyles,
  tokens,
  Input,
  Button,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  ToggleButton,
} from '@fluentui/react-components';
import {
  Search24Regular,
  Add24Regular,
  ArrowSort24Regular,
  ArrowDownload24Regular,
  Navigation24Regular,
} from '@fluentui/react-icons';
import { useDocStore } from '../store/useDocStore';
import { DocType, TYPE_LABELS, SortField } from '../types';

interface ToolbarProps {
  onOpenImport: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const useStyles = makeStyles({
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 20px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    flexWrap: 'wrap',
  },
  searchBox: {
    flex: 1,
    minWidth: '200px',
    maxWidth: '400px',
  },
  chips: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  spacer: {
    flex: 1,
  },
  actions: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
});

const TYPE_CHIPS: { type: DocType; label: string; color: string }[] = [
  { type: 'doc', label: 'Word', color: '#185ABD' },
  { type: 'ppt', label: 'PPT', color: '#C43E1C' },
  { type: 'xls', label: 'Excel', color: '#107C41' },
  { type: 'pdf', label: 'PDF', color: '#D93025' },
];

const SORT_OPTIONS: { field: SortField; label: string }[] = [
  { field: 'dateAdded', label: 'Date Added' },
  { field: 'title', label: 'Title' },
  { field: 'status', label: 'Status' },
  { field: 'type', label: 'Type' },
  { field: 'sharedBy', label: 'Shared By' },
];

export function Toolbar({ onOpenImport, sidebarOpen, onToggleSidebar }: ToolbarProps) {
  const styles = useStyles();
  const searchQuery = useDocStore((s) => s.searchQuery);
  const setSearchQuery = useDocStore((s) => s.setSearchQuery);
  const filterType = useDocStore((s) => s.filterType);
  const setFilterType = useDocStore((s) => s.setFilterType);
  const sortField = useDocStore((s) => s.sortField);
  const setSortField = useDocStore((s) => s.setSortField);
  const sortDirection = useDocStore((s) => s.sortDirection);
  const toggleSortDirection = useDocStore((s) => s.toggleSortDirection);
  const setAddDialogOpen = useDocStore((s) => s.setAddDialogOpen);

  return (
    <div className={styles.toolbar}>
      <Button
        appearance="subtle"
        icon={<Navigation24Regular />}
        onClick={onToggleSidebar}
        size="small"
        title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
      />

      <Input
        className={styles.searchBox}
        contentBefore={<Search24Regular />}
        placeholder="Search documents..."
        value={searchQuery}
        onChange={(_, data) => setSearchQuery(data.value)}
        appearance="filled-darker"
      />

      <div className={styles.chips}>
        {TYPE_CHIPS.map((chip) => (
          <ToggleButton
            key={chip.type}
            size="small"
            appearance="subtle"
            checked={filterType === chip.type}
            onClick={() =>
              setFilterType(filterType === chip.type ? null : chip.type)
            }
            style={
              filterType === chip.type
                ? { backgroundColor: chip.color + '33', color: chip.color, borderColor: chip.color + '66' }
                : {}
            }
          >
            {chip.label}
          </ToggleButton>
        ))}
      </div>

      <div className={styles.spacer} />

      <div className={styles.actions}>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Button
              appearance="subtle"
              icon={<ArrowSort24Regular />}
              size="small"
            >
              {SORT_OPTIONS.find((o) => o.field === sortField)?.label}
              {sortDirection === 'asc' ? ' ↑' : ' ↓'}
            </Button>
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              {SORT_OPTIONS.map((opt) => (
                <MenuItem
                  key={opt.field}
                  onClick={() => {
                    if (sortField === opt.field) {
                      toggleSortDirection();
                    } else {
                      setSortField(opt.field);
                    }
                  }}
                >
                  {opt.label}
                  {sortField === opt.field && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                </MenuItem>
              ))}
            </MenuList>
          </MenuPopover>
        </Menu>

        <Button
          appearance="subtle"
          icon={<ArrowDownload24Regular />}
          onClick={onOpenImport}
        >
          Import
        </Button>

        <Button
          appearance="primary"
          icon={<Add24Regular />}
          onClick={() => setAddDialogOpen(true)}
        >
          Add Document
        </Button>
      </div>
    </div>
  );
}
