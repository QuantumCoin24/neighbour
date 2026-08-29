'use client';

import AdventureWorkspace from '../../../../../components/adventures/AdventureWorkspace';
import { useParams } from 'next/navigation';

export default function PersonalAdventuresPage() {
  const params = useParams<{ username: string }>();
  return <AdventureWorkspace mode="PERSONAL" username={params.username} />;
}
