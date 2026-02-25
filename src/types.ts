export type DocType = 'doc' | 'ppt' | 'xls' | 'pdf' | 'other';

export type DocSource =
  | 'sharepoint'
  | 'onedrive'
  | 'teams'
  | 'email'
  | 'local'
  | 'other';

export type DocStatus =
  | 'new'
  | 'reading'
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
  openIn?: string;
}

export type FilterView =
  | 'all'
  | 'pinned'
  | 'reading'
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
  'new',
  'reading',
  'action-needed',
  'done',
];

export const STATUS_LABELS: Record<DocStatus, string> = {
  new: 'New',
  reading: 'In Progress',
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
