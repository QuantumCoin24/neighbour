'use client';

import { useEffect, useState } from 'react';
import { getMyCommunities, type MembershipCommunity } from '@neighbour/api-client';
import Link from 'next/link';

export default function MyCommunityPage() {
  const [communities, setCommunities] = useState<MembershipCommunity[]>([]);

  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      setMessage('Please login');
      return;
    }

    getMyCommunities(token)
      .then(setCommunities)
      .catch((error) => setMessage(error.message));
  }, []);

  return (
    <main
      style={{
        padding: '40px',
      }}
    >
      <h1>My Communities</h1>

      {message && <p>{message}</p>}

      {communities.map((item) => (
        <div
          key={item.id}
          style={{
            border: '1px solid #ddd',
            borderRadius: '12px',
            padding: '20px',
            marginTop: '20px',
          }}
        >
          <h2>📍 {item.community.name}</h2>

          <p>{item.community.description}</p>

          <p>Role: {item.role}</p>

          <Link href={`/community/${item.community.slug}`}>Open Community →</Link>
        </div>
      ))}
    </main>
  );
}
