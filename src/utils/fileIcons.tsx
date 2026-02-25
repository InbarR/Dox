import React from 'react';
import { makeStyles } from '@fluentui/react-components';
import { DocType } from '../types';

const useStyles = makeStyles({
  wrapper: {
    width: '48px',
    height: '48px',
    flexShrink: 0,
    position: 'relative',
  },
});

/**
 * Microsoft Office-style document icons matching the Windows Files app.
 * White document behind, colored app logo square overlapping on the left.
 */
function WordIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 44 44" fill="none">
      {/* Document (white page, behind) */}
      <path
        d="M16 4C16 2.9 16.9 2 18 2H34L42 10V40C42 41.1 41.1 42 40 42H18C16.9 42 16 41.1 16 40V4Z"
        fill="#E8E8E8"
      />
      <path d="M34 2L42 10H36C34.9 10 34 9.1 34 8V2Z" fill="#C8C8C8" />
      {/* Text lines on document */}
      <rect x="20" y="16" width="16" height="1.5" rx="0.75" fill="#C0C0C0" />
      <rect x="20" y="21" width="14" height="1.5" rx="0.75" fill="#C0C0C0" />
      <rect x="20" y="26" width="16" height="1.5" rx="0.75" fill="#C0C0C0" />
      <rect x="20" y="31" width="10" height="1.5" rx="0.75" fill="#C0C0C0" />
      {/* Colored logo square (Word blue) */}
      <rect x="2" y="10" width="24" height="24" rx="3" fill="#185ABD" />
      <text
        x="14" y="27"
        textAnchor="middle"
        fill="white"
        fontFamily="Segoe UI, sans-serif"
        fontWeight="700"
        fontSize="16"
      >
        W
      </text>
    </svg>
  );
}

function ExcelIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 44 44" fill="none">
      <path
        d="M16 4C16 2.9 16.9 2 18 2H34L42 10V40C42 41.1 41.1 42 40 42H18C16.9 42 16 41.1 16 40V4Z"
        fill="#E8E8E8"
      />
      <path d="M34 2L42 10H36C34.9 10 34 9.1 34 8V2Z" fill="#C8C8C8" />
      {/* Grid lines on document */}
      <rect x="20" y="15" width="17" height="0.8" fill="#C0C0C0" />
      <rect x="20" y="20" width="17" height="0.8" fill="#C0C0C0" />
      <rect x="20" y="25" width="17" height="0.8" fill="#C0C0C0" />
      <rect x="20" y="30" width="17" height="0.8" fill="#C0C0C0" />
      <rect x="26" y="14" width="0.8" height="18" fill="#C0C0C0" />
      <rect x="32" y="14" width="0.8" height="18" fill="#C0C0C0" />
      {/* Colored logo square (Excel green) */}
      <rect x="2" y="10" width="24" height="24" rx="3" fill="#107C41" />
      <text
        x="14" y="27"
        textAnchor="middle"
        fill="white"
        fontFamily="Segoe UI, sans-serif"
        fontWeight="700"
        fontSize="16"
      >
        X
      </text>
    </svg>
  );
}

function PowerPointIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 44 44" fill="none">
      <path
        d="M16 4C16 2.9 16.9 2 18 2H34L42 10V40C42 41.1 41.1 42 40 42H18C16.9 42 16 41.1 16 40V4Z"
        fill="#E8E8E8"
      />
      <path d="M34 2L42 10H36C34.9 10 34 9.1 34 8V2Z" fill="#C8C8C8" />
      {/* Slide shape on document */}
      <rect x="20" y="15" width="17" height="12" rx="1" fill="#D0D0D0" stroke="#B0B0B0" strokeWidth="0.5" />
      <rect x="22" y="29" width="13" height="1.5" rx="0.75" fill="#C0C0C0" />
      <rect x="22" y="32" width="9" height="1.5" rx="0.75" fill="#C0C0C0" />
      {/* Colored logo square (PowerPoint red/orange) */}
      <rect x="2" y="10" width="24" height="24" rx="3" fill="#C43E1C" />
      <text
        x="14" y="27"
        textAnchor="middle"
        fill="white"
        fontFamily="Segoe UI, sans-serif"
        fontWeight="700"
        fontSize="16"
      >
        P
      </text>
    </svg>
  );
}

function PdfIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 44 44" fill="none">
      <path
        d="M16 4C16 2.9 16.9 2 18 2H34L42 10V40C42 41.1 41.1 42 40 42H18C16.9 42 16 41.1 16 40V4Z"
        fill="#E8E8E8"
      />
      <path d="M34 2L42 10H36C34.9 10 34 9.1 34 8V2Z" fill="#C8C8C8" />
      {/* Text lines */}
      <rect x="20" y="16" width="16" height="1.5" rx="0.75" fill="#C0C0C0" />
      <rect x="20" y="21" width="14" height="1.5" rx="0.75" fill="#C0C0C0" />
      <rect x="20" y="26" width="16" height="1.5" rx="0.75" fill="#C0C0C0" />
      <rect x="20" y="31" width="10" height="1.5" rx="0.75" fill="#C0C0C0" />
      {/* Colored logo square (PDF red) */}
      <rect x="2" y="10" width="24" height="24" rx="3" fill="#D93025" />
      <text
        x="14" y="26.5"
        textAnchor="middle"
        fill="white"
        fontFamily="Segoe UI, sans-serif"
        fontWeight="800"
        fontSize="10"
      >
        PDF
      </text>
    </svg>
  );
}

function GenericFileIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 44 44" fill="none">
      <path
        d="M10 4C10 2.9 10.9 2 12 2H28L36 10V40C36 41.1 35.1 42 34 42H12C10.9 42 10 41.1 10 40V4Z"
        fill="#E8E8E8"
      />
      <path d="M28 2L36 10H30C28.9 10 28 9.1 28 8V2Z" fill="#C8C8C8" />
      <rect x="14" y="16" width="16" height="1.5" rx="0.75" fill="#C0C0C0" />
      <rect x="14" y="21" width="14" height="1.5" rx="0.75" fill="#C0C0C0" />
      <rect x="14" y="26" width="16" height="1.5" rx="0.75" fill="#C0C0C0" />
      <rect x="14" y="31" width="10" height="1.5" rx="0.75" fill="#C0C0C0" />
    </svg>
  );
}

const ICON_MAP: Record<DocType, React.FC> = {
  doc: WordIcon,
  ppt: PowerPointIcon,
  xls: ExcelIcon,
  pdf: PdfIcon,
  other: GenericFileIcon,
};

export function FileTypeIcon({ type }: { type: DocType }) {
  const styles = useStyles();
  const Icon = ICON_MAP[type];
  return (
    <div className={styles.wrapper}>
      <Icon />
    </div>
  );
}

export function detectTypeFromUrl(url: string): DocType {
  const lower = url.toLowerCase();
  if (lower.match(/\.docx?(\?|#|$)/) || lower.includes(':w:') || lower.includes('/word/'))
    return 'doc';
  if (
    lower.match(/\.pptx?m?(\?|#|$)/) ||
    lower.includes(':p:') ||
    lower.includes('/powerpoint/')
  )
    return 'ppt';
  if (lower.match(/\.xlsx?(\?|#|$)/) || lower.includes(':x:') || lower.includes('/excel/'))
    return 'xls';
  if (lower.match(/\.pdf(\?|#|$)/)) return 'pdf';
  return 'other';
}

export function detectSourceFromUrl(
  url: string
): 'sharepoint' | 'onedrive' | 'teams' | 'other' {
  const lower = url.toLowerCase();
  if (lower.includes('sharepoint.com') && !lower.includes('-my.sharepoint.com'))
    return 'sharepoint';
  if (lower.includes('onedrive') || lower.includes('1drv.ms') || lower.includes('-my.sharepoint'))
    return 'onedrive';
  if (lower.includes('teams.microsoft.com')) return 'teams';
  return 'other';
}
