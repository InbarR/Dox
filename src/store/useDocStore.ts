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
  categories: string[];
  searchQuery: string;
  filterView: FilterView;
  filterCategory: string | null;
  filterType: DocType | null;
  filterSource: DocSource | null;
  sortField: SortField;
  sortDirection: SortDirection;
  selectedDocId: string | null;
  addDialogOpen: boolean;
  reminderDialogDocId: string | null;
  collapsedCategories: Set<string>;

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
  setCategory: (id: string, category: string | undefined) => void;
  addCategory: (name: string) => void;
  removeCategory: (name: string) => void;
  toggleCategoryCollapse: (name: string) => void;
  setSearchQuery: (query: string) => void;
  setFilterView: (view: FilterView) => void;
  setFilterCategory: (category: string | null) => void;
  setFilterType: (type: DocType | null) => void;
  setFilterSource: (source: DocSource | null) => void;
  setSortField: (field: SortField) => void;
  toggleSortDirection: () => void;
  setSelectedDocId: (id: string | null) => void;
  setAddDialogOpen: (open: boolean) => void;
  setReminderDialogDocId: (id: string | null) => void;
  refreshOpenStatus: () => Promise<void>;
  autoImport: () => Promise<void>;
  getFilteredDocs: () => DocItem[];
}

const STATUS_CYCLE: DocStatus[] = [
  'new',
  'reading',
  'action-needed',
  'done',
];

function persist(docs: DocItem[]) {
  // Strip runtime-only fields before saving
  const cleaned = docs.map(({ openIn, ...rest }) => rest);
  window.docshelf?.saveDocs(cleaned);
}

export const useDocStore = create<DocStore>((set, get) => ({
  docs: [],
  categories: [],
  searchQuery: '',
  filterView: 'all',
  filterCategory: null,
  filterType: null,
  filterSource: null,
  sortField: 'dateAdded',
  sortDirection: 'desc',
  selectedDocId: null,
  addDialogOpen: false,
  reminderDialogDocId: null,
  collapsedCategories: new Set<string>(),

  loadDocs: async () => {
    const raw = await window.docshelf.loadDocs();
    const docs = (raw || []).map((d: any) => ({
      ...d,
      status: d.status === 'unread' || d.status === 'reviewed' ? 'new' : d.status,
    }));
    // Extract unique categories from docs
    const cats = new Set<string>();
    for (const d of docs) {
      if (d.category) cats.add(d.category);
    }
    set({ docs, categories: [...cats].sort() });
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
      status: 'new',
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

  setCategory: (id, category) => {
    const docs = get().docs.map((d) =>
      d.id === id ? { ...d, category } : d
    );
    // Update categories list
    const cats = new Set(get().categories);
    if (category) cats.add(category);
    set({ docs, categories: [...cats].sort() });
    persist(docs);
  },

  addCategory: (name) => {
    const cats = new Set(get().categories);
    cats.add(name);
    set({ categories: [...cats].sort() });
  },

  removeCategory: (name) => {
    // Remove category from list and unassign from all docs
    const cats = new Set(get().categories);
    cats.delete(name);
    const docs = get().docs.map((d) =>
      d.category === name ? { ...d, category: undefined } : d
    );
    set({ categories: [...cats].sort(), docs });
    persist(docs);
  },

  toggleCategoryCollapse: (name) => {
    const collapsed = new Set(get().collapsedCategories);
    if (collapsed.has(name)) collapsed.delete(name);
    else collapsed.add(name);
    set({ collapsedCategories: collapsed });
  },

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilterView: (filterView) => set({ filterView }),
  setFilterCategory: (filterCategory) => set({ filterCategory }),
  setFilterType: (filterType) => set({ filterType }),
  setFilterSource: (filterSource) => set({ filterSource }),
  setSortField: (sortField) => set({ sortField }),
  toggleSortDirection: () =>
    set((s) => ({ sortDirection: s.sortDirection === 'asc' ? 'desc' : 'asc' })),
  setSelectedDocId: (selectedDocId) => set({ selectedDocId }),
  setAddDialogOpen: (addDialogOpen) => set({ addDialogOpen }),
  setReminderDialogDocId: (reminderDialogDocId) => set({ reminderDialogDocId }),

  autoImport: async () => {
    try {
      const [openDocs, recentDocs] = await Promise.all([
        window.docshelf.scanOpenDocs(),
        window.docshelf.scanRecentDocs(),
      ]);

      // Build a title→doc lookup from COM/MRU results (which have URLs)
      const urlLookup = new Map<string, { path: string; type: string; source: string; owner?: string }>();
      for (const doc of [...openDocs, ...recentDocs]) {
        if (doc.path) {
          urlLookup.set(doc.title.toLowerCase(), { path: doc.path, type: doc.type, source: doc.source, owner: doc.owner });
        }
      }

      // Deduplicate scanned results
      const seen = new Set<string>();
      const scanned: Array<{ title: string; path: string; type: string; source: string; owner?: string }> = [];
      for (const doc of [...openDocs, ...recentDocs]) {
        const key = (doc.path || doc.title).toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          scanned.push(doc);
        }
      }

      // Find docs not already in the store
      const existing = get().docs;
      const existingUrls = new Set(
        existing.filter((d) => d.url).map((d) => d.url.toLowerCase())
      );
      const existingTitles = new Set(
        existing.map((d) => d.title.toLowerCase())
      );

      let changed = false;
      const newDocs: DocItem[] = [];
      for (const doc of scanned) {
        // Skip docs without a URL - they're noise from browser tab titles
        if (!doc.path) continue;
        const urlKey = doc.path.toLowerCase();
        const titleKey = doc.title.toLowerCase();
        // Skip if URL or title already exists
        if (existingUrls.has(urlKey) || existingTitles.has(titleKey)) continue;
        // Prevent adding duplicates within the same batch
        existingUrls.add(urlKey);
        existingTitles.add(titleKey);
        {
          newDocs.push({
            id: uuidv4(),
            title: doc.title,
            url: doc.path,
            type: doc.type as DocItem['type'],
            source: doc.source as DocItem['source'],
            sharedBy: doc.owner || '',
            dateAdded: new Date().toISOString(),
            pinned: false,
            status: 'new',
            tags: [],
            notes: '',
          });
        }
      }

      // Enrich existing docs: fill in missing URLs, sharedBy, type, source
      for (const d of existing) {
        const lookup = urlLookup.get(d.title.toLowerCase());
        if (lookup) {
          if (!d.url && lookup.path) { d.url = lookup.path; changed = true; }
          if (!d.sharedBy && lookup.owner) { d.sharedBy = lookup.owner; changed = true; }
          if (d.type === 'other' && lookup.type !== 'other') { d.type = lookup.type as DocItem['type']; changed = true; }
          if (d.source === 'other' && lookup.source !== 'other') { d.source = lookup.source as DocItem['source']; changed = true; }
        }
      }

      if (newDocs.length > 0 || changed) {
        const docs = [...existing, ...newDocs];
        set({ docs });
        persist(docs);
      }
    } catch (err) {
      console.error('autoImport failed:', err);
    }
  },

  refreshOpenStatus: async () => {
    try {
      const [openDocs, browserTabs] = await Promise.all([
        window.docshelf.scanOpenDocs(),
        window.docshelf.scanBrowserTabs(),
      ]);

      const openTitles = new Map<string, string>();
      for (const od of openDocs) {
        openTitles.set(od.title.toLowerCase(), od.app || 'Open');
        if (od.path) {
          openTitles.set(od.path.toLowerCase(), od.app || 'Open');
        }
      }
      for (const bt of browserTabs) {
        openTitles.set(bt.title.toLowerCase(), 'Browser');
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
    const { docs, searchQuery, filterView, filterCategory, filterType, filterSource, sortField, sortDirection } =
      get();

    let filtered = [...docs];

    // Filter by view
    if (filterView === 'pinned') {
      filtered = filtered.filter((d) => d.pinned);
    } else if (filterView === 'open') {
      filtered = filtered.filter((d) => !!d.openIn);
    } else if (filterView !== 'all') {
      filtered = filtered.filter((d) => d.status === filterView);
    }

    // Filter by category
    if (filterCategory) {
      filtered = filtered.filter((d) => d.category === filterCategory);
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
      // Map common search terms to type codes
      const typeAliases: Record<string, string> = {
        word: 'doc', doc: 'doc', docx: 'doc',
        ppt: 'ppt', pptx: 'ppt', powerpoint: 'ppt',
        xls: 'xls', xlsx: 'xls', excel: 'xls',
        pdf: 'pdf',
      };
      const matchedType = typeAliases[q];
      filtered = filtered.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.sharedBy.toLowerCase().includes(q) ||
          d.url.toLowerCase().includes(q) ||
          d.notes.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q)) ||
          d.type === matchedType ||
          d.source.toLowerCase().includes(q)
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
