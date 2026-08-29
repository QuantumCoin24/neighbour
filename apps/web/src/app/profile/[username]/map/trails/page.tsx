'use client';

import { useParams } from 'next/navigation';
import TrailWorkspace from '../../../../../components/trails/TrailWorkspace';

export default function PersonalTrailsPage() {
  const params = useParams();
  const username = params.username as string;

  return (
    <TrailWorkspace
      mode="PERSONAL"
      username={username}
      backHref={`/profile/${encodeURIComponent(username)}/map`}
    />
  );
}
