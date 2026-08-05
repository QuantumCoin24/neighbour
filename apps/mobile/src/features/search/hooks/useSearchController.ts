import { EMPTY_SEARCH_RESPONSE, search, type SearchResponse } from '@neighbour/api-client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  addSearchHistoryItem,
  clearSearchHistory,
  loadSearchHistory,
  removeSearchHistoryItem,
} from '../storage/search-history';
import { getSearchResultCounts, type SearchCategory } from '../types';

const SEARCH_DEBOUNCE_MS = 350;
const MINIMUM_QUERY_LENGTH = 2;

export function useSearchController() {
  const requestSequence = useRef(0);

  const [query, setQuery] = useState('');
  const [searchedQuery, setSearchedQuery] = useState('');
  const [category, setCategory] = useState<SearchCategory>('all');
  const [results, setResults] = useState<SearchResponse>(EMPTY_SEARCH_RESPONSE);
  const [history, setHistory] = useState<string[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    void loadSearchHistory()
      .then((items) => {
        if (mounted) {
          setHistory(items);
        }
      })
      .finally(() => {
        if (mounted) {
          setHistoryLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const executeSearch = useCallback(
    async (
      value: string,
      options: {
        refresh?: boolean;
        saveHistory?: boolean;
      } = {},
    ) => {
      const term = value.trim();

      if (term.length < MINIMUM_QUERY_LENGTH) {
        requestSequence.current += 1;
        setResults(EMPTY_SEARCH_RESPONSE);
        setSearchedQuery('');
        setLoading(false);
        setRefreshing(false);
        setError(null);

        return;
      }

      const requestId = requestSequence.current + 1;
      requestSequence.current = requestId;

      if (options.refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const response = await search(term);

        if (requestSequence.current !== requestId) {
          return;
        }

        setResults(response);
        setSearchedQuery(term);

        if (options.saveHistory) {
          const nextHistory = await addSearchHistoryItem(term);

          if (requestSequence.current === requestId) {
            setHistory(nextHistory);
          }
        }
      } catch {
        if (requestSequence.current === requestId) {
          setError('Search could not reach Neighbour. Please try again.');
        }
      } finally {
        if (requestSequence.current === requestId) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const term = query.trim();

    if (term.length < MINIMUM_QUERY_LENGTH) {
      void executeSearch(term);

      return;
    }

    const timer = setTimeout(() => {
      void executeSearch(term);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [executeSearch, query]);

  const submit = useCallback(() => {
    const term = query.trim();

    if (term.length >= MINIMUM_QUERY_LENGTH) {
      void executeSearch(term, {
        saveHistory: true,
      });
    }
  }, [executeSearch, query]);

  const selectHistoryItem = useCallback(
    (value: string) => {
      setQuery(value);

      void executeSearch(value, {
        saveHistory: true,
      });
    },
    [executeSearch],
  );

  const removeHistoryItem = useCallback(async (value: string) => {
    const next = await removeSearchHistoryItem(value);

    setHistory(next);
  }, []);

  const clearHistory = useCallback(async () => {
    await clearSearchHistory();
    setHistory([]);
  }, []);

  const clearQuery = useCallback(() => {
    requestSequence.current += 1;
    setQuery('');
    setSearchedQuery('');
    setResults(EMPTY_SEARCH_RESPONSE);
    setError(null);
    setLoading(false);
    setRefreshing(false);
    setCategory('all');
  }, []);

  const refresh = useCallback(async () => {
    const term = query.trim();

    if (term.length >= MINIMUM_QUERY_LENGTH) {
      await executeSearch(term, {
        refresh: true,
      });
    }
  }, [executeSearch, query]);

  const retry = useCallback(async () => {
    await executeSearch(query, {
      saveHistory: false,
    });
  }, [executeSearch, query]);

  const counts = useMemo(() => getSearchResultCounts(results), [results]);

  return {
    query,
    setQuery,
    searchedQuery,
    category,
    setCategory,
    results,
    counts,
    history,
    historyLoading,
    loading,
    refreshing,
    error,
    minimumQueryLength: MINIMUM_QUERY_LENGTH,
    submit,
    selectHistoryItem,
    removeHistoryItem,
    clearHistory,
    clearQuery,
    refresh,
    retry,
  };
}
