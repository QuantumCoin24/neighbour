'use client';

import { search, type SearchResponse } from '@neighbour/api-client';
import { type FormEvent, useState } from 'react';

const EMPTY_RESULTS: SearchResponse = {
  users: [],
  communities: [],
  neighbourhoods: [],
  events: [],
  posts: [],
};

function getResultCount(results: SearchResponse): number {
  return (
    results.users.length +
    results.communities.length +
    results.neighbourhoods.length +
    results.events.length +
    results.posts.length
  );
}

function formatEventDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [searchedQuery, setSearchedQuery] = useState('');
  const [results, setResults] = useState<SearchResponse>(EMPTY_RESULTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resultCount = getResultCount(results);

  async function runSearch(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const term = query.trim();

    if (!term) {
      setResults(EMPTY_RESULTS);
      setSearchedQuery('');
      setError(null);

      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await search(term);

      setResults(data);
      setSearchedQuery(term);
    } catch {
      setError('Search could not reach Neighbour. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        margin: '0 auto',
        maxWidth: '960px',
        padding: '40px 24px 80px',
      }}
    >
      <header>
        <p
          style={{
            color: '#315c4c',
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            margin: 0,
            textTransform: 'uppercase',
          }}
        >
          Universal discovery
        </p>

        <h1 style={{ marginBottom: '8px' }}>Search Neighbour™</h1>

        <p
          style={{
            color: '#526159',
            marginTop: 0,
          }}
        >
          Find people, communities, neighbourhoods, events and local discussions.
        </p>
      </header>

      <form
        onSubmit={runSearch}
        style={{
          display: 'flex',
          gap: '10px',
          marginTop: '24px',
        }}
      >
        <input
          aria-label="Search Neighbour"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
          }}
          placeholder="Search people, communities, events..."
          style={{
            border: '1px solid #c8d3cc',
            borderRadius: '14px',
            flex: 1,
            fontSize: '16px',
            minHeight: '50px',
            padding: '12px 16px',
          }}
        />

        <button
          disabled={loading}
          type="submit"
          style={{
            background: '#315c4c',
            border: 'none',
            borderRadius: '14px',
            color: '#fff',
            cursor: loading ? 'wait' : 'pointer',
            fontWeight: 700,
            minWidth: '120px',
            padding: '12px 24px',
          }}
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {error ? (
        <section
          style={{
            border: '1px solid #b54444',
            borderRadius: '16px',
            marginTop: '24px',
            padding: '18px',
          }}
        >
          <strong style={{ color: '#b54444' }}>Search unavailable</strong>

          <p>{error}</p>
        </section>
      ) : null}

      {!loading && searchedQuery ? (
        <p
          style={{
            color: '#526159',
            marginTop: '28px',
          }}
        >
          {resultCount === 1
            ? `1 result for “${searchedQuery}”`
            : `${resultCount} results for “${searchedQuery}”`}
        </p>
      ) : null}

      {!loading && searchedQuery && !error && resultCount === 0 ? (
        <section
          style={{
            background: '#eef2ee',
            borderRadius: '18px',
            marginTop: '20px',
            padding: '22px',
          }}
        >
          <h2 style={{ marginTop: 0 }}>No matches found</h2>

          <p style={{ marginBottom: 0 }}>Try another name, area or keyword.</p>
        </section>
      ) : null}

      {results.users.length > 0 ? (
        <ResultSection title="People">
          {results.users.map((person) => (
            <ResultCard
              key={person.id}
              title={person.displayName}
              description="Neighbour member"
              metadata={`ID: ${person.id}`}
            />
          ))}
        </ResultSection>
      ) : null}

      {results.communities.length > 0 ? (
        <ResultSection title="Communities">
          {results.communities.map((community) => (
            <ResultCard
              key={community.id}
              title={community.name}
              description={`@${community.slug}`}
              metadata={`ID: ${community.id}`}
            />
          ))}
        </ResultSection>
      ) : null}

      {results.neighbourhoods.length > 0 ? (
        <ResultSection title="Neighbourhoods">
          {results.neighbourhoods.map((neighbourhood) => (
            <ResultCard
              key={neighbourhood.id}
              title={neighbourhood.name}
              description={neighbourhood.localArea ?? 'Local neighbourhood'}
              metadata={`ID: ${neighbourhood.id}`}
            />
          ))}
        </ResultSection>
      ) : null}

      {results.events.length > 0 ? (
        <ResultSection title="Events">
          {results.events.map((event) => (
            <ResultCard
              key={event.id}
              title={event.title}
              description={event.community?.name ?? 'Neighbour event'}
              metadata={formatEventDate(event.startsAt)}
            />
          ))}
        </ResultSection>
      ) : null}

      {results.posts.length > 0 ? (
        <ResultSection title="Posts">
          {results.posts.map((post) => (
            <ResultCard
              key={post.id}
              title={post.title?.trim() || 'Community post'}
              description={post.content}
              metadata={`ID: ${post.id}`}
            />
          ))}
        </ResultSection>
      ) : null}
    </main>
  );
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: '32px' }}>
      <h2>{title}</h2>

      <div
        style={{
          display: 'grid',
          gap: '14px',
        }}
      >
        {children}
      </div>
    </section>
  );
}

function ResultCard({
  title,
  description,
  metadata,
}: {
  title: string;
  description: string;
  metadata: string;
}) {
  return (
    <article
      style={{
        background: '#fff',
        border: '1px solid #dde4df',
        borderRadius: '18px',
        padding: '20px',
      }}
    >
      <h3 style={{ margin: '0 0 8px' }}>{title}</h3>

      <p
        style={{
          color: '#526159',
          margin: '0 0 10px',
          whiteSpace: 'pre-wrap',
        }}
      >
        {description}
      </p>

      <small style={{ color: '#7e8b84' }}>{metadata}</small>
    </article>
  );
}
