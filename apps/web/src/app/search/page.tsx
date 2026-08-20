'use client';

import Link from 'next/link';

import {
  type FormEvent,
  type ReactNode,
  useMemo,
  useState,
} from 'react';

import {
  search,
  type SearchResponse,
} from '@neighbour/api-client';

const EMPTY_RESULTS: SearchResponse = {
  users: [],
  communities: [],
  neighbourhoods: [],
  events: [],
  posts: [],
};

function getResultCount(
  results: SearchResponse,
) {
  return (
    results.users.length +
    results.communities.length +
    results.neighbourhoods.length +
    results.events.length +
    results.posts.length
  );
}

function formatEventDate(
  value: string,
) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return new Intl.DateTimeFormat(
    'en-GB',
    {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(date);
}

export default function SearchPage() {
  const [query, setQuery] =
    useState('');

  const [searchedQuery, setSearchedQuery] =
    useState('');

  const [results, setResults] =
    useState<SearchResponse>(
      EMPTY_RESULTS,
    );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const resultCount =
    useMemo(
      () => getResultCount(results),
      [results],
    );

  async function runSearch(
    event?: FormEvent<HTMLFormElement>,
  ) {
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
      const data =
        await search(term);

      setResults(data);
      setSearchedQuery(term);
    } catch {
      setError(
        'Search could not reach Neighbour. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="search-page">
      <header className="search-header">
        <div>
          <div className="search-eyebrow">
            DISCOVER NEIGHBOUR™
          </div>

          <h1>Search</h1>

          <p>
            Find people, communities,
            neighbourhoods, events and local
            conversations across Neighbour™.
          </p>
        </div>

        {searchedQuery ? (
          <div className="search-count">
            <strong>
              {resultCount}
            </strong>

            <span>
              {resultCount === 1
                ? 'result'
                : 'results'}
            </span>
          </div>
        ) : null}
      </header>

      <section className="search-hero">
        <form
          onSubmit={(event) =>
            void runSearch(event)
          }
        >
          <div className="search-field">
            <span>⌕</span>

            <input
              aria-label="Search Neighbour"
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value,
                )
              }
              placeholder="Search people, communities, areas, events or posts"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'Searching…'
              : 'Search Neighbour™'}
          </button>
        </form>

        <div className="search-hints">
          <span>People</span>
          <span>Communities</span>
          <span>Neighbourhoods</span>
          <span>Events</span>
          <span>Posts</span>
        </div>
      </section>

      {error ? (
        <section className="search-error">
          <strong>
            Search unavailable
          </strong>

          <p>{error}</p>
        </section>
      ) : null}

      {!searchedQuery &&
      !loading ? (
        <section className="search-start">
          <div className="search-start-icon">
            ⌖
          </div>

          <div>
            <div className="search-start-eyebrow">
              UNIVERSAL DISCOVERY
            </div>

            <h2>
              Find what’s happening around you.
            </h2>

            <p>
              Search across the whole Neighbour™
              network from one place.
            </p>
          </div>

          <div className="search-start-grid">
            <div>
              <strong>◎</strong>
              <span>People</span>
            </div>

            <div>
              <strong>⌂</strong>
              <span>Communities</span>
            </div>

            <div>
              <strong>⌖</strong>
              <span>Nearby</span>
            </div>

            <div>
              <strong>17</strong>
              <span>Events</span>
            </div>
          </div>
        </section>
      ) : null}

      {!loading &&
      searchedQuery &&
      !error ? (
        <div className="search-summary">
          Showing {resultCount}{' '}
          {resultCount === 1
            ? 'result'
            : 'results'}{' '}
          for{' '}
          <strong>
            “{searchedQuery}”
          </strong>
        </div>
      ) : null}

      {!loading &&
      searchedQuery &&
      !error &&
      resultCount === 0 ? (
        <section className="search-empty">
          <div>⌕</div>

          <h2>No matches found</h2>

          <p>
            Try another name, area,
            postcode or keyword.
          </p>
        </section>
      ) : null}

      {results.users.length >
      0 ? (
        <ResultSection
          title="People"
          description="Neighbours matching your search."
        >
          {results.users.map(
            (person) => (
              <ResultCard
                key={person.id}
                icon="◎"
                title={
                  person.displayName
                }
                description="Neighbour member"
                metadata="Person"
              />
            ),
          )}
        </ResultSection>
      ) : null}

      {results.communities.length >
      0 ? (
        <ResultSection
          title="Communities"
          description="Local groups and community spaces."
        >
          {results.communities.map(
            (community) => (
              <ResultCard
                key={community.id}
                icon="⌂"
                title={community.name}
                description={`@${community.slug}`}
                metadata="Community"
                href={`/community/${community.slug}`}
              />
            ),
          )}
        </ResultSection>
      ) : null}

      {results.neighbourhoods.length >
      0 ? (
        <ResultSection
          title="Neighbourhoods"
          description="Local areas within the Neighbour™ network."
        >
          {results.neighbourhoods.map(
            (neighbourhood) => (
              <ResultCard
                key={
                  neighbourhood.id
                }
                icon="⌖"
                title={
                  neighbourhood.name
                }
                description={
                  neighbourhood.localArea ??
                  'Local neighbourhood'
                }
                metadata="Neighbourhood"
                href="/my-community"
              />
            ),
          )}
        </ResultSection>
      ) : null}

      {results.events.length >
      0 ? (
        <ResultSection
          title="Events"
          description="Things happening locally."
        >
          {results.events.map(
            (event) => (
              <ResultCard
                key={event.id}
                icon="17"
                title={event.title}
                description={
                  event.community
                    ?.name ??
                  'Neighbour event'
                }
                metadata={formatEventDate(
                  event.startsAt,
                )}
              />
            ),
          )}
        </ResultSection>
      ) : null}

      {results.posts.length >
      0 ? (
        <ResultSection
          title="Posts"
          description="Local conversations and updates."
        >
          {results.posts.map(
            (post) => (
              <ResultCard
                key={post.id}
                icon="□"
                title={
                  post.title?.trim() ||
                  'Community post'
                }
                description={
                  post.content
                }
                metadata="Community post"
              />
            ),
          )}
        </ResultSection>
      ) : null}

      <style>{`
        .search-page {
          width: min(100% - 48px, 1300px);
          margin: 0 auto;
          padding: 42px 0 90px;
        }

        .search-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 24px;
          margin-bottom: 25px;
        }

        .search-eyebrow {
          margin-bottom: 8px;
          color: #0a6945;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: .15em;
        }

        .search-header h1 {
          margin: 0;
          color: #102019;
          font-size: clamp(34px,4vw,48px);
          letter-spacing: -.045em;
        }

        .search-header p {
          max-width: 670px;
          margin: 9px 0 0;
          color: #75827c;
          font-size: 14px;
          line-height: 1.5;
        }

        .search-count {
          min-width: 96px;
          padding: 11px 14px;
          border: 1px solid #dce4df;
          border-radius: 14px;
          background: #fff;
          text-align: center;
        }

        .search-count strong {
          display: block;
          color: #086240;
          font-size: 19px;
        }

        .search-count span {
          color: #8b9690;
          font-size: 9px;
        }

        .search-hero {
          padding: 22px;
          border-radius: 22px;
          background:
            linear-gradient(
              120deg,
              #09192b,
              #143353
            );
        }

        .search-hero form {
          display: grid;
          grid-template-columns:
            minmax(0,1fr) auto;
          gap: 10px;
        }

        .search-field {
          min-height: 50px;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 0 15px;
          border-radius: 14px;
          background: #fff;
        }

        .search-field span {
          color: #086240;
          font-size: 17px;
        }

        .search-field input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          font: inherit;
          font-size: 13px;
        }

        .search-hero button {
          min-width: 160px;
          border: 0;
          border-radius: 14px;
          background: #0b754d;
          color: #fff;
          font: inherit;
          font-size: 10px;
          font-weight: 850;
          cursor: pointer;
        }

        .search-hero button:disabled {
          opacity: .6;
          cursor: wait;
        }

        .search-hints {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 14px;
        }

        .search-hints span {
          padding: 6px 9px;
          border-radius: 999px;
          background:
            rgba(255,255,255,.08);
          color:
            rgba(255,255,255,.67);
          font-size: 8px;
          font-weight: 750;
        }

        .search-start {
          display: grid;
          grid-template-columns:
            auto minmax(0,1fr);
          gap: 18px;
          margin-top: 26px;
          padding: 28px;
          border: 1px solid
            rgba(18,48,38,.07);
          border-radius: 21px;
          background: #fff;
        }

        .search-start-icon {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          border-radius: 15px;
          background: #eaf5ef;
          color: #08704a;
          font-size: 22px;
        }

        .search-start-eyebrow {
          color: #0a6945;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: .13em;
        }

        .search-start h2 {
          margin: 7px 0 0;
          color: #102019;
          font-size: 23px;
          letter-spacing: -.03em;
        }

        .search-start p {
          margin: 7px 0 0;
          color: #78847e;
          font-size: 11px;
        }

        .search-start-grid {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns:
            repeat(4,minmax(0,1fr));
          gap: 9px;
          margin-top: 8px;
        }

        .search-start-grid div {
          padding: 15px;
          border-radius: 13px;
          background: #f7f9f8;
          text-align: center;
        }

        .search-start-grid strong {
          display: block;
          color: #08704a;
          font-size: 16px;
        }

        .search-start-grid span {
          display: block;
          margin-top: 5px;
          color: #67776f;
          font-size: 9px;
          font-weight: 750;
        }

        .search-summary {
          margin: 24px 2px 12px;
          color: #74817b;
          font-size: 10px;
        }

        .search-summary strong {
          color: #31463c;
        }

        .search-error,
        .search-empty {
          margin-top: 20px;
          padding: 24px;
          border-radius: 17px;
          background: #fff;
          text-align: center;
        }

        .search-error strong {
          color: #a33f3f;
        }

        .search-error p,
        .search-empty p {
          margin: 6px 0 0;
          color: #7a8781;
          font-size: 11px;
        }

        .search-empty div {
          font-size: 26px;
        }

        .search-empty h2 {
          margin: 8px 0 0;
        }

        .result-section {
          margin-top: 28px;
        }

        .result-section-header {
          margin-bottom: 12px;
        }

        .result-section-header h2 {
          margin: 0;
          color: #102019;
          font-size: 19px;
        }

        .result-section-header p {
          margin: 4px 0 0;
          color: #7f8b85;
          font-size: 10px;
        }

        .result-grid {
          display: grid;
          grid-template-columns:
            repeat(2,minmax(0,1fr));
          gap: 11px;
        }

        .result-card {
          display: grid;
          grid-template-columns:
            auto minmax(0,1fr) auto;
          gap: 12px;
          align-items: center;
          padding: 16px;
          border: 1px solid #e0e7e2;
          border-radius: 16px;
          background: #fff;
          color: inherit;
          text-decoration: none;
        }

        .result-card-icon {
          width: 39px;
          height: 39px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #eaf5ef;
          color: #08704a;
          font-size: 13px;
          font-weight: 850;
        }

        .result-card h3 {
          margin: 0;
          color: #21362d;
          font-size: 12px;
        }

        .result-card p {
          overflow: hidden;
          margin: 4px 0 0;
          color: #728078;
          font-size: 10px;
          line-height: 1.45;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .result-card small {
          display: block;
          margin-top: 5px;
          color: #a0aaa5;
          font-size: 8px;
        }

        .result-card-arrow {
          color: #87948e;
        }

        @media (max-width: 760px) {
          .search-page {
            width: min(100% - 28px,680px);
            padding-top: 24px;
          }

          .search-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .search-hero form,
          .result-grid {
            grid-template-columns: 1fr;
          }

          .search-hero button {
            min-height: 46px;
          }

          .search-start-grid {
            grid-template-columns:
              repeat(2,minmax(0,1fr));
          }
        }
      `}</style>
    </main>
  );
}

function ResultSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="result-section">
      <div className="result-section-header">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <div className="result-grid">
        {children}
      </div>
    </section>
  );
}

function ResultCard({
  icon,
  title,
  description,
  metadata,
  href,
}: {
  icon: string;
  title: string;
  description: string;
  metadata: string;
  href?: string;
}) {
  const body = (
    <>
      <div className="result-card-icon">
        {icon}
      </div>

      <div>
        <h3>{title}</h3>
        <p>{description}</p>
        <small>{metadata}</small>
      </div>

      <div className="result-card-arrow">
        {href ? '→' : '·'}
      </div>
    </>
  );

  return href ? (
    <Link
      href={href}
      className="result-card"
    >
      {body}
    </Link>
  ) : (
    <article className="result-card">
      {body}
    </article>
  );
}
