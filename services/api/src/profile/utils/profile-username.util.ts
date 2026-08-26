export function normaliseUsername(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9._]+/g, '.')
    .replace(/^[._]+|[._]+$/g, '')
    .replace(/[._]{2,}/g, '.')
    .slice(0, 30)
    .replace(/[._]+$/g, '');
}

export function createUsernameCandidate(displayName: string, userId: string): string {
  const base = displayName
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .replace(/\.{2,}/g, '.')
    .slice(0, 21)
    .replace(/\.+$/g, '');

  const safeBase = base.length >= 3 ? base : 'neighbour';
  const suffix = userId.replace(/-/g, '').slice(0, 8);

  return `${safeBase}.${suffix}`.slice(0, 30);
}
