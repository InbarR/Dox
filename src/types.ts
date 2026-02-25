export type DocType = 'doc' | 'ppt' | 'xls' | 'pdf' | 'other';

export type DocSource =
  | 'sharepoint'
  | 'onedrive'
  | 'teams'
  | 'email'
  | 'local'
  | 'other';

export type DocStatus =
  | 'unread'
  | 'reading'
  | 'reviewed'
  | 'action-needed'
  | 'done';

export interface DocItem {
  id: string;
  title: string;
  url: string;
  type: DocType;
  source: DocSource;
  sharedBy: string;
  dateAdded: string;
  dateModified?: string;
  pinned: boolean;
  status: DocStatus;
  tags: string[];
  notes: string;
  reminder?: string;
  openIn?: string; // e.g. "Word", "Excel", "PowerPoint", "Browser" - set when doc is detected as open
}

export type FilterView =
  | 'all'
  | 'pinned'
  | 'unread'
  | 'reading'
  | 'reviewed'
  | 'action-needed'
  | 'done';

export type SortField =
  | 'title'
  | 'dateAdded'
  | 'status'
  | 'type'
  | 'source'
  | 'sharedBy';

export type SortDirection = 'asc' | 'desc';

export const STATUS_ORDER: DocStatus[] = [
  'unread',
  'reading',
  'reviewed',
  'action-needed',
  'done',
];

export const STATUS_LABELS: Record<DocStatus, string> = {
  unread: 'Unread',
  reading: 'Reading',
  reviewed: 'Reviewed',
  'action-needed': 'Action Needed',
  done: 'Done',
};

export const TYPE_LABELS: Record<DocType, string> = {
  doc: 'Word',
  ppt: 'PowerPoint',
  xls: 'Excel',
  pdf: 'PDF',
  other: 'Other',
};

export const SOURCE_LABELS: Record<DocSource, string> = {
  sharepoint: 'SharePoint',
  onedrive: 'OneDrive',
  teams: 'Teams',
  email: 'Email',
  local: 'Local',
  other: 'Other',
};
