import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createCommunitySlug } from '../src/community/utils/community-slug.util';

describe('createCommunitySlug', () => {
  it('creates a URL-safe community slug', () => {
    assert.equal(
      createCommunitySlug('Blackley & Charlestown Residents'),
      'blackley-and-charlestown-residents',
    );
  });

  it('removes punctuation and repeated separators', () => {
    assert.equal(createCommunitySlug('  Neighbour™ -- Community!!!  '), 'neighbour-community');
  });

  it('provides a fallback slug', () => {
    assert.equal(createCommunitySlug('***'), 'community');
  });
});
