'use client';

import { useEffect, useState } from 'react';

import { useParams } from 'next/navigation';

import {
  attachMediaToPost,
  createPost,
  getCommunity,
  getCommunityFeed,
} from '@neighbour/api-client';

import CommunityHeader from '../../../components/community/CommunityHeader';
import CommunityTabs from '../../../components/community/CommunityTabs';
import PostCard from '../../../components/feed/PostCard';
import CreatePost from '../../../components/feed/CreatePost';
import EmptyFeed from '../../../components/feed/EmptyFeed';
import { uploadWebMedia, type WebPendingMedia } from '../../../lib/media/upload';

export default function CommunityPage() {
  const params = useParams();

  const slug = params.slug as string;

  const [community, setCommunity] = useState<any>(null);

  const [posts, setPosts] = useState<any[]>([]);

  const [content, setContent] = useState('');
  const [media, setMedia] = useState<WebPendingMedia[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [publishError, setPublishError] = useState<string | null>(null);

  async function load() {
    const token = localStorage.getItem('accessToken');

    if (!token) return;

    const c = await getCommunity(token, slug);

    setCommunity(c);

    const feed = await getCommunityFeed(token, slug);

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

    if (!token || publishing) return;

    if (!content.trim() && media.length === 0) return;

    setPublishing(true);
    setPublishError(null);
    setUploadProgress(0);

    const uploadedIds: string[] = [];

    try {
      for (let index = 0; index < media.length; index += 1) {
        const item = media[index];

        const asset = await uploadWebMedia(item, (fileProgress) => {
          const overall = (index + fileProgress) / Math.max(1, media.length);

          setUploadProgress(overall);
        });

        uploadedIds.push(asset.id);
      }

      const created = await createPost(token, {
        communityId: community.id,
        content: content.trim(),
      });

      if (uploadedIds.length > 0) {
        await attachMediaToPost(created.id, uploadedIds);
      }

      media.forEach((item) => URL.revokeObjectURL(item.previewUrl));

      setContent('');
      setMedia([]);
      setUploadProgress(1);

      await load();
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : 'The post could not be published.');
    } finally {
      setPublishing(false);
    }
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

      <CreatePost
        busy={publishing}
        content={content}
        error={publishError}
        media={media}
        setContent={setContent}
        setMedia={setMedia}
        submit={submit}
        uploadProgress={uploadProgress}
      />

      <h2>Community Feed</h2>

      {posts.length === 0 ? (
        <p>No posts loaded yet.</p>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </main>
  );
}
