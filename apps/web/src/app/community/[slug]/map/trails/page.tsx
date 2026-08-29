'use client';

import { useParams } from 'next/navigation';
import TrailWorkspace from '../../../../../components/trails/TrailWorkspace';

export default function CommunityTrailsPage() {
  const params = useParams();
  const slug = params.slug as string;

  return (
    <TrailWorkspace
      mode="COMMUNITY"
      slug={slug}
      backHref={`/community/${encodeURIComponent(slug)}/map`}
    />
  );
}
