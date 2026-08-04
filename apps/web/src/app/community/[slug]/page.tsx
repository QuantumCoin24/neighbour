'use client';

import { useEffect, useState } from 'react';

import { useParams } from 'next/navigation';

import { getCommunity, getCommunityFeed, createPost } from '@neighbour/api-client';

import CommunityHeader from '../../../components/community/CommunityHeader';
import CommunityTabs from '../../../components/community/CommunityTabs';
import PostCard from '../../../components/feed/PostCard';
import CreatePost from '../../../components/feed/CreatePost';
import EmptyFeed from '../../../components/feed/EmptyFeed';

export default function CommunityPage() {
  const params = useParams();

  const slug = params.slug as string;

  const [community, setCommunity] = useState<any>(null);

  const [posts, setPosts] = useState<any[]>([]);

  const [content, setContent] = useState('');

  async function load() {
    const token = localStorage.getItem('accessToken');

    if (!token) return;

    const c = await getCommunity(token, slug);

    setCommunity(c);

    const feed = await getCommunityFeed(token, slug);

    console.log('FEED RESPONSE:', feed);
    console.log('FEED ITEMS:', feed.items);
    console.log('FEED FULL JSON:', JSON.stringify(feed, null, 2));

    setPosts(feed.items);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  async function submit() {
    const token = localStorage.getItem('accessToken');

    if (!token) return;

    if (!content.trim()) return;

    await createPost(token, {
      communityId: community.id,
      content,
    });

    setContent('');

    await load();
  }

  if (!community) return <p>Loading...</p>;

  return (
    <main
      style={{
        padding: '40px',
        maxWidth: '900px',
        margin: 'auto',
      }}
    >
      <CommunityHeader community={community} />

      <CommunityTabs slug={slug} />

      <CreatePost content={content} setContent={setContent} submit={submit} />

      <h2>Community Feed</h2>

      {posts.length === 0 ? (
        <p>No posts loaded yet.</p>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </main>
  );
}
