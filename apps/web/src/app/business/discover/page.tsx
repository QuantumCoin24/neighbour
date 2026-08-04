'use client';

import { useState } from 'react';

import { searchBusinesses } from '@neighbour/api-client';

export default function BusinessDiscoverPage() {
  const [query, setQuery] = useState('');

  const [results, setResults] = useState<any[]>([]);

  async function search() {
    const data = await searchBusinesses(query);

    setResults(data);
  }

  return (
    <main style={page}>
      <h1>🔎 Neighbour™ Business Discover</h1>

      <p>Find trusted businesses inside your community.</p>

      <div style={searchBox}>
        <input
          placeholder="Search businesses..."

          value={query}

          onChange={(e) => setQuery(e.target.value)}

          style={input}
        />

        <button
          onClick={search}

          style={button}
        >
          Search
        </button>
      </div>

      <section style={grid}>
        {results.map((business) => (
          <div
            key={business.id}

            style={card}
          >
            <h2>{business.name}</h2>

            <p>{business.category}</p>

            <p>{business.description}</p>
          </div>
        ))}
      </section>
    </main>
  );
}

const page = {
  padding: '40px',

  maxWidth: '1100px',

  margin: 'auto',
};

const searchBox = {
  display: 'flex',

  gap: '12px',

  marginTop: '30px',
};

const input = {
  flex: 1,

  padding: '14px',

  borderRadius: '12px',

  border: '1px solid #ddd',
};

const button = {
  padding: '14px 22px',

  borderRadius: '12px',

  border: 'none',

  background: '#08111F',

  color: '#fff',
};

const grid = {
  display: 'grid',

  gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))',

  gap: '20px',

  marginTop: '30px',
};

const card = {
  background: '#fff',

  padding: '25px',

  borderRadius: '20px',

  boxShadow: '0 10px 30px rgba(0,0,0,.08)',
};
