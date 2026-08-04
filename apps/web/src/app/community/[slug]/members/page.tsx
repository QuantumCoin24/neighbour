'use client';

import { useParams } from 'next/navigation';

export default function MembersPage() {
  const params = useParams();

  return (
    <main
      style={{
        padding: '40px',
      }}
    >
      <h1>Community Members</h1>

      <p>Members for {params.slug as string}</p>

      <div>👤 Jason</div>
    </main>
  );
}
