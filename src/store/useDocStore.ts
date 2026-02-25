import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  DocItem,
  DocStatus,
  DocType,
  DocSource,
  FilterView,
  SortField,
  SortDirection,
} from '../types';

interface DocStore {
  docs: DocItem[];
  searchQuery: string;
  filterView: FilterView;
  filterType: DocType | null;
  filterSource: DocSource | null;
  sortField: SortField;
  sortDirection: SortDirection;
  selectedDocId: string | null;
  addDialogOpen: boolean;
  reminderDialogDocId: string | null;

  loadDocs: () => Promise<void>;
  addDoc: (
    doc: Pick<DocItem, 'title' | 'url' | 'type' | 'source' | 'sharedBy'>
  ) => void;
  updateDoc: (id: string, updates: Partial<DocItem>) => void;
  deleteDoc: (id: string) => void;
  togglePin: (id: string) => void;
  cycleStatus: (id: string) => void;
  setStatus: (id: string, status: DocStatus) => void;
  setReminder: (id: string, reminder: string | undefined) => void;
  setSearchQuery: (query: string) => void;
  setFilterView: (view: FilterView) => void;
  setFilterType: (type: DocType | null) => void;
  setFilterSource: (source: DocSource | null) => void;
  setSortField: (field: SortField) => void;
  toggleSortDirection: () => void;
  setSelectedDocId: (id: string | null) => void;
  setAddDialogOpen: (open: boolean) => void;
  setReminderDialogDocId: (id: string | null) => void;
  refreshOpenStatus: () => Promise<void>;
  getFilteredDocs: () => DocItem[];
}

const STATUS_CYCLE: DocStatus[] = [
  'unread',
  'reading',
  'reviewed',
  'action-needed',
  'done',
];

function persist(docs: DocItem[]) {
  window.docshelf?.saveDocs(docs);
}

export const useDocStore = create<DocStore>((set, get) => ({
  docs: [],
  searchQuery: '',
  filterView: 'all',
  filterType: null,
  filterSource: null,
  sortField: 'dateAdded',
  sortDirection: 'desc',
  selectedDocId: null,
  addDialogOpen: false,
  reminderDialogDocId: null,

  loadDocs: async () => {
    const docs = await window.docshelf.loadDocs();
    set({ docs: docs || [] });
  },

  addDoc: (input) => {
    const doc: DocItem = {
      id: uuidv4(),
      title: input.title,
      url: input.url,
      type: input.type,
      source: input.source,
      sharedBy: input.sharedBy,
      dateAdded: new Date().toISOString(),
      pinned: false,
      status: 'unread',
      tags: [],
      notes: '',
    };
    const docs = [...get().docs, doc];
    set({ docs });
    persist(docs);
  },

  updateDoc: (id, updates) => {
    const docs = get().docs.map((d) =>
      d.id === id ? { ...d, ...updates, dateModified: new Date().toISOString() } : d
    );
    set({ docs });
    persist(docs);
  },

  deleteDoc: (id) => {
    const docs = get().docs.filter((d) => d.id !== id);
    set({ docs, selectedDocId: get().selectedDocId === id ? null : get().selectedDocId });
    persist(docs);
  },

  togglePin: (id) => {
    const docs = get().docs.map((d) =>
      d.id === id ? { ...d, pinned: !d.pinned } : d
    );
    set({ docs });
    persist(docs);
  },

  cycleStatus: (id) => {
    const doc = get().docs.find((d) => d.id === id);
    if (!doc) return;
    const idx = STATUS_CYCLE.indexOf(doc.status);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    const docs = get().docs.map((d) =>
      d.id === id ? { ...d, status: next } : d
    );
    set({ docs });
    persist(docs);
  },

  setStatus: (id, status) => {
    const docs = get().docs.map((d) =>
      d.id === id ? { ...d, status } : d
    );
    set({ docs });
    persist(docs);
  },

  setReminder: (id, reminder) => {
    const docs = get().docs.map((d) =>
      d.id === id ? { ...d, reminder } : d
    );
    set({ docs });
    persist(docs);
  },

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilterView: (filterView) => set({ filterView }),
  setFilterType: (filterType) => set({ filterType }),
  setFilterSource: (filterSource) => set({ filterSource }),
  setSortField: (sortField) => set({ sortField }),
  toggleSortDirection: () =>
    set((s) => ({ sortDirection: s.sortDirection === 'asc' ? 'desc' : 'asc' })),
  setSelectedDocId: (selectedDocId) => set({ selectedDocId }),
  setAddDialogOpen: (addDialogOpen) => set({ addDialogOpen }),
  setReminderDialogDocId: (reminderDialogDocId) => set({ reminderDialogDocId }),

  refreshOpenStatus: async () => {
    try {
      const openDocs = await window.docshelf.scanOpenDocs();
      const openTitles = new Map<string, string>();
      for (const od of openDocs) {
        openTitles.set(od.title.toLowerCase(), od.app || 'Open');
        if (od.path) {
          openTitles.set(od.path.toLowerCase(), od.app || 'Open');
        }
      }
      const docs = get().docs.map((d) => {
        const byTitle = openTitles.get(d.title.toLowerCase());
        const byUrl = d.url ? openTitles.get(d.url.toLowerCase()) : undefined;
        return { ...d, openIn: byTitle || byUrl || undefined };
      });
      set({ docs });
    } catch { /* ignore */ }
  },

  getFilteredDocs: () => {
    const { docs, searchQuery, filterView, filterType, filterSource, sortField, sortDirection } =
      get();

    let filtered = [...docs];

    // Filter by view
    if (filterView === 'pinned') {
      filtered = filtered.filter((d) => d.pinned);
    } else if (filterView !== 'all') {
      filtered = filtered.filter((d) => d.status === filterView);
    }

    // Filter by type
    if (filterType) {
      filtered = filtered.filter((d) => d.type === filterType);
    }

    // Filter by source
    if (filterSource) {
      filtered = filtered.filter((d) => d.source === filterSource);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.sharedBy.toLowerCase().includes(q) ||
          d.url.toLowerCase().includes(q) ||
          d.notes.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sort - pinned always on top
    filtered.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;

      let cmp = 0;
      if (sortField === 'dateAdded') {
        cmp = new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
      } else if (sortField === 'title') {
        cmp = a.title.localeCompare(b.title);
      } else if (sortField === 'status') {
        cmp = STATUS_CYCLE.indexOf(a.status) - STATUS_CYCLE.indexOf(b.status);
      } else if (sortField === 'type') {
        cmp = a.type.localeCompare(b.type);
      } else if (sortField === 'source') {
        cmp = a.source.localeCompare(b.source);
      } else if (sortField === 'sharedBy') {
        cmp = a.sharedBy.localeCompare(b.sharedBy);
      }

      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return filtered;
  },
}));
