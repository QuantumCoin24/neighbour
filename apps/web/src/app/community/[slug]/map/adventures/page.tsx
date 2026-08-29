'use client';

import AdventureWorkspace from '../../../../../components/adventures/AdventureWorkspace';
import { getCommunity } from '@neighbour/api-client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CommunityAdventuresPage() {
  const params = useParams<{ slug: string }>();
  const [communityId, setCommunityId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const auth = localStorage.getItem('accessToken') ?? '';

    void getCommunity(params.slug)
      .then((community: any) => setCommunityId(community.id))
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : 'Community could not be loaded.'),
      );
  }, [params.slug]);

  if (error) return <main style={{ padding: 32 }}>{error}</main>;
  if (!communityId) return <main style={{ padding: 32 }}>Loading community adventures…</main>;

  return (
    <AdventureWorkspace mode="COMMUNITY" communityId={communityId} communitySlug={params.slug} />
  );
}
