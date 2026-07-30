import assert from 'node:assert/strict';
import { test } from 'node:test';

const API = 'http://localhost:4000/api/v1';

test('Neighbour profile journey: create identity → view profile → update profile', async () => {
  const email = `profile-${Date.now()}@neighbour.local`;

  const registerResponse = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password: 'NeighbourProfilePassword123!',
      displayName: 'Profile Test User',
    }),
  });

  assert.equal(registerResponse.status, 201);

  const registerBody = await registerResponse.json();

  const token = registerBody.accessToken;
  const userId = registerBody.user.id;

  assert.ok(token);
  assert.ok(userId);

  const profileResponse = await fetch(`${API}/profiles/me`, {
    method: 'PATCH',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      username: `neighbour_${Date.now()}`,
      bio: 'Building my first Neighbour profile',
      localArea: 'Blackley',
      showLocalArea: true,
    }),
  });

  const profileText = await profileResponse.text();

  console.log('PROFILE RESPONSE:', profileText);

  assert.equal(profileResponse.status, 200);

  const profileBody = JSON.parse(profileText);

  assert.equal(profileBody.userId, userId);
  assert.equal(profileBody.localArea, 'Blackley');

  const getResponse = await fetch(`${API}/profiles/me`, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.equal(getResponse.status, 200);

  const currentProfile = await getResponse.json();

  assert.equal(currentProfile.localArea, 'Blackley');

  const updateResponse = await fetch(`${API}/profiles/me`, {
    method: 'PATCH',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      bio: 'My updated Neighbour identity',
    }),
  });

  assert.equal(updateResponse.status, 200);

  const updatedProfile = await updateResponse.json();

  assert.equal(
    updatedProfile.bio,
    'My updated Neighbour identity',
  );
});
