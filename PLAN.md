# DocShelf - Document Tracker Desktop App

## Overview
A desktop app (Electron + React + TypeScript) to track all shared documents in one place.
Similar to the Windows Files app but with pinning, status tracking, and reminders.

## Architecture

```
docshelf/
├── package.json
├── tsconfig.json
├── electron/
│   ├── main.ts              # Electron main process
│   ├── preload.ts            # Secure bridge to renderer
│   └── store.ts              # JSON file read/write (electron-store)
├── src/
│   ├── index.tsx             # React entry
│   ├── App.tsx               # Root component with layout
│   ├── types.ts              # Shared TypeScript types
│   ├── store/
│   │   └── useDocStore.ts    # Zustand store for state management
│   ├── components/
│   │   ├── Sidebar.tsx       # Left nav: filters, tags, sources
│   │   ├── Toolbar.tsx       # Search bar, sort, view toggle
│   │   ├── DocList.tsx       # Main document list (table/grid)
│   │   ├── DocCard.tsx       # Single document row/card
│   │   ├── AddDocDialog.tsx  # Add doc modal (paste link / drag-drop)
│   │   ├── DocDetails.tsx    # Side panel with doc details/actions
│   │   ├── ReminderDialog.tsx# Set reminder modal
│   │   └── StatusBadge.tsx   # Status pill component
│   └── utils/
│       ├── fileIcons.ts      # Map file extensions to icons
│       └── notifications.ts  # System notification for reminders
├── data/
│   └── docs.json             # Persisted document data (auto-created)
└── assets/
    └── icons/                # File type icons (doc, ppt, xls, pdf...)
```

## Data Model (docs.json)

```typescript
interface Document {
  id: string;                          // UUID
  title: string;                       // Document name
  url: string;                         // Link to open (SharePoint/OneDrive/local)
  type: 'doc' | 'ppt' | 'xls' | 'pdf' | 'other';  // File type
  source: 'sharepoint' | 'onedrive' | 'teams' | 'email' | 'local' | 'other';
  sharedBy?: string;                   // Who shared it
  dateAdded: string;                   // ISO timestamp
  dateModified?: string;               // Last modified
  pinned: boolean;                     // Pin to top
  status: 'unread' | 'reading' | 'reviewed' | 'action-needed' | 'done';
  tags: string[];                      // Custom tags
  notes?: string;                      // Personal notes
  reminder?: string;                   // ISO timestamp for reminder
  thumbnail?: string;                  // Optional thumbnail path
}
```

## Features (Phase 1 - MVP)

### 1. Document List View
- Dark theme (matching Windows Files app style from screenshot)
- Table view with columns: icon | title | source | shared by | date | status
- Sort by any column
- Pinned items always on top (with pin icon)

### 2. Add Documents
- "Add" button opens dialog
- Paste a URL (auto-detect type from extension)
- Drag & drop files/links onto app window
- Manual entry: title, URL, type, source, shared by

### 3. Search & Filter
- Search bar at top (search title, shared by, notes)
- Filter chips: by type (doc/ppt/xls/pdf), by source, by status, by person
- Sidebar with saved filters

### 4. Status Tracking
- Click status badge to cycle: Unread → Reading → Reviewed → Done
- "Action Needed" status with visual highlight (orange/red)
- Status shown as colored pill badge

### 5. Pin Documents
- Click pin icon to pin/unpin
- Pinned docs float to top of list regardless of sort

### 6. Reminders
- Right-click or button → "Set Reminder"
- Pick date/time
- System notification fires at scheduled time
- Visual indicator on docs with active reminders (bell icon)

### 7. Context Menu / Actions
- Open document (launches in default browser/app)
- Copy link
- Set status
- Pin/Unpin
- Set reminder
- Add tags
- Add notes
- Delete

### 8. Persistence
- All data saved to local JSON file via electron-store
- Auto-save on every change

## UI Design
- Dark theme (matches Windows 11 dark mode)
- Left sidebar: navigation (All, Pinned, By Status, By Type, Tags)
- Top toolbar: search bar + filter chips + add button
- Main area: document list
- Fluent-style design using @fluentui/react-components

## Tech Stack
- **Electron** - desktop shell
- **React 18** + **TypeScript** - UI
- **Zustand** - state management
- **Fluent UI v9** (@fluentui/react-components) - Windows 11 native look
- **electron-store** - JSON persistence
- **uuid** - ID generation
- **date-fns** - date formatting
- **node-notifier** or Electron Notification API - reminders

## Build Steps

1. Initialize project with npm, install dependencies
2. Set up Electron main process + preload
3. Set up React app with Fluent UI dark theme
4. Build core components: Sidebar, Toolbar, DocList, DocCard
5. Implement add document flow (dialog + drag-drop)
6. Implement status, pin, reminder features
7. Wire up persistence (electron-store)
8. Add search and filtering
9. Add reminder notifications
10. Polish and test
