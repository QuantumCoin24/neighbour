import React from 'react';

export interface NeighbourButtonProps {
  children: React.ReactNode;

  variant?: 'primary' | 'secondary' | 'ghost';

  onClick?: () => void;

  type?: 'button' | 'submit' | 'reset';
}

export function NeighbourButton({
  children,
  variant = 'primary',
  onClick,
  type = 'button',
}: NeighbourButtonProps) {
  const variants = {
    primary: {
      background: '#D6A84F',
      color: '#08111F',
    },

    secondary: {
      background: '#2F80ED',
      color: '#FFFFFF',
    },

    ghost: {
      background: 'transparent',
      color: '#08111F',
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        padding: '12px 24px',
        borderRadius: '999px',
        border: 'none',
        fontWeight: 600,
        cursor: 'pointer',
        ...variants[variant],
      }}
    >
      {children}
    </button>
  );
}
