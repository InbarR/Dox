import React from 'react';
import { Badge, makeStyles, mergeClasses } from '@fluentui/react-components';
import { DocStatus, STATUS_LABELS } from '../types';

const STATUS_COLORS: Record<DocStatus, string> = {
  unread: '#4A9FE5',
  reading: '#E8A317',
  reviewed: '#4CAF50',
  'action-needed': '#E85D4A',
  done: '#6B6B6B',
};

const useStyles = makeStyles({
  badge: {
    cursor: 'pointer',
    userSelect: 'none',
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 10px',
    borderRadius: '12px',
    whiteSpace: 'nowrap',
    lineHeight: '20px',
    display: 'inline-block',
    transition: 'opacity 0.15s',
    ':hover': {
      opacity: 0.85,
    },
  },
});

interface StatusBadgeProps {
  status: DocStatus;
  onClick?: () => void;
}

export function StatusBadge({ status, onClick }: StatusBadgeProps) {
  const styles = useStyles();
  const color = STATUS_COLORS[status];

  return (
    <span
      className={styles.badge}
      style={{
        backgroundColor: color + '22',
        color: color,
        border: `1px solid ${color}44`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      title="Click to change status"
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
