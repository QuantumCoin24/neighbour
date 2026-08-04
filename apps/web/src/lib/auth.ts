export function getAccessToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem('accessToken');
}

export function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('accessToken', accessToken);

  localStorage.setItem('refreshToken', refreshToken);
}

export function logout() {
  localStorage.removeItem('accessToken');

  localStorage.removeItem('refreshToken');

  window.location.href = '/auth';
}
