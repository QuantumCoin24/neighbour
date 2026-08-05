import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContextState {
  requestId: string;
  method: string;
  path: string;
  startedAt: number;
  userId?: string;
}

const storage = new AsyncLocalStorage<RequestContextState>();

export function runWithRequestContext<T>(state: RequestContextState, callback: () => T): T {
  return storage.run(state, callback);
}

export function getRequestContext(): RequestContextState | undefined {
  return storage.getStore();
}

export function setRequestContextUser(userId: string): void {
  const state = storage.getStore();

  if (state) {
    state.userId = userId;
  }
}
