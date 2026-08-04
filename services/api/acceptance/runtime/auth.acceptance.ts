import assert from 'node:assert/strict';
import { test } from 'node:test';

const API = 'http://localhost:4000/api/v1';

test('Neighbour authentication journey: register → login → me', async () => {
  const email = `test-${Date.now()}@neighbour.local`;

  const registerResponse = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password: 'NeighbourTestPassword123!',
      displayName: 'Neighbour Test User',
    }),
  });

  assert.equal(registerResponse.status, 201);

  const registerBody = await registerResponse.json();

  assert.ok(registerBody.accessToken);
  assert.ok(registerBody.refreshToken);
  assert.equal(registerBody.user.email, email);

  const loginResponse = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password: 'NeighbourTestPassword123!',
    }),
  });

  assert.equal(loginResponse.status, 200);

  const loginBody = await loginResponse.json();

  assert.ok(loginBody.accessToken);

  const meResponse = await fetch(`${API}/auth/me`, {
    headers: {
      authorization: `Bearer ${loginBody.accessToken}`,
    },
  });

  assert.equal(meResponse.status, 200);

  const meBody = await meResponse.json();

  assert.equal(meBody.email, email);
});
