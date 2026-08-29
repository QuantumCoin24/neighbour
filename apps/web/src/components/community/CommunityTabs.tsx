'use client';

import Link from 'next/link';

export default function CommunityTabs({ slug }: { slug: string }) {
  return (
    <nav
      style={{
        display: 'flex',
        gap: '20px',
        marginBottom: '25px',
      }}
    >
      <Link href={`/community/${slug}`}>Feed</Link>

      <Link href={`/community/${slug}/members`}>Members</Link>

      <Link href={`/community/${slug}/events`}>Events</Link>

      <Link href={`/community/${slug}/map`}>Map</Link>

      <Link href={`/community/${slug}/about`}>About</Link>
    </nav>
  );
}
