import React from 'react';

export function NeighbourBadge({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '6px 12px',
        borderRadius: '999px',
        background: '#F7F9FC',
        color: '#08111F',
        fontSize: '14px',
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  );
}
