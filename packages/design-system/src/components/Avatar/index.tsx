import React from 'react';

export interface NeighbourAvatarProps {
  src?: string;
  name: string;
  size?: number;
  verified?: boolean;
}

export function NeighbourAvatar({ src, name, size = 48, verified = false }: NeighbourAvatarProps) {
  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
      }}
    >
      <img
        src={src ?? `https://api.dicebear.com/7.x/initials/svg?seed=${name}`}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
        }}
      />

      {verified && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: '#D6A84F',
            border: '2px solid white',
          }}
        />
      )}
    </div>
  );
}
