import * as SecureStore from 'expo-secure-store';

const SEARCH_HISTORY_KEY = 'neighbour_search_history';
const MAX_HISTORY_ITEMS = 10;

export async function loadSearchHistory(): Promise<string[]> {
  const stored = await SecureStore.getItemAsync(SEARCH_HISTORY_KEY);

  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is string => typeof item === 'string' && item.trim().length > 0,
    );
  } catch {
    return [];
  }
}

export async function saveSearchHistory(history: string[]): Promise<void> {
  await SecureStore.setItemAsync(
    SEARCH_HISTORY_KEY,
    JSON.stringify(history.slice(0, MAX_HISTORY_ITEMS)),
  );
}

export async function addSearchHistoryItem(query: string): Promise<string[]> {
  const value = query.trim();

  if (!value) {
    return loadSearchHistory();
  }

  const current = await loadSearchHistory();

  const next = [
    value,
    ...current.filter((item) => item.toLocaleLowerCase() !== value.toLocaleLowerCase()),
  ].slice(0, MAX_HISTORY_ITEMS);

  await saveSearchHistory(next);

  return next;
}

export async function removeSearchHistoryItem(query: string): Promise<string[]> {
  const current = await loadSearchHistory();

  const next = current.filter(
    (item) => item.toLocaleLowerCase() !== query.trim().toLocaleLowerCase(),
  );

  await saveSearchHistory(next);

  return next;
}

export async function clearSearchHistory(): Promise<void> {
  await SecureStore.deleteItemAsync(SEARCH_HISTORY_KEY);
}
