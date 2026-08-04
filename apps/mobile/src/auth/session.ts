const SESSION_KEY = 'neighbour_session';

let session: string | null = null;

export function saveSession(value: string) {
  session = value;
}

export function getSession() {
  return session;
}

export function clearSession() {
  session = null;
}

export function hasSession() {
  return session !== null;
}
