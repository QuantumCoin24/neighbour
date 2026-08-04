import React from 'react';

export function NeighbourInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: '100%',
        padding: '14px 18px',
        borderRadius: '16px',
        border: '1px solid #E5E7EB',
        fontSize: '16px',
        outline: 'none',
        ...props.style,
      }}
    />
  );
}
