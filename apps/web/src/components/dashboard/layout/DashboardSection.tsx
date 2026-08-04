'use client';

import React from 'react';

export default function DashboardSection({
  children,
  fullWidth = false,
}: {
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div
      style={{
        gridColumn: fullWidth ? '1 / -1' : undefined,
      }}
    >
      {children}
    </div>
  );
}
