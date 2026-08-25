'use client';

import { useEffect, useState } from 'react';

import { useParams } from 'next/navigation';

import {
  attachMediaToPost,
  createPost,
  deleteCommunity,
  getCommunity,
  getCommunityFeed,
  getMyCommunities,
  leaveCommunity,
  type CommunityMembership,
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
  const [membership, setMembership] = useState<CommunityMembership | null>(null);
  const [membershipLoading, setMembershipLoading] = useState(true);
  const [leavingCommunity, setLeavingCommunity] = useState(false);
  const [deletingCommunity, setDeletingCommunity] = useState(false);
  const [communityActionError, setCommunityActionError] = useState<string | null>(null);

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

    setMembershipLoading(true);

    try {
      const memberships = await getMyCommunities(token);

      const ownMembership =
        memberships.find((item) => item.community.id === c.id || item.community.slug === c.slug) ??
        null;

      setMembership(
        ownMembership?.role === 'OWNER'
          ? {
              ...ownMembership,
              status: 'ACTIVE',
            }
          : ownMembership,
      );
    } catch {
      setMembership(null);
    } finally {
      setMembershipLoading(false);
    }

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

  async function handleLeaveCommunity() {
    if (
      !community ||
      !membership ||
      membership.status !== 'ACTIVE' ||
      membership.role === 'OWNER' ||
      leavingCommunity
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Leave "${community.name}"? You can rejoin later if the community allows it.`,
    );

    if (!confirmed) {
      return;
    }

    setLeavingCommunity(true);
    setCommunityActionError(null);

    try {
      await leaveCommunity(community.slug);

      setMembership(null);

      setCommunity((current: any) =>
        current
          ? {
              ...current,
              memberCount: Math.max(0, current.memberCount - 1),
            }
          : current,
      );
    } catch (error) {
      setCommunityActionError(
        error instanceof Error
          ? error.message
          : 'The community could not be left. Please try again.',
      );
    } finally {
      setLeavingCommunity(false);
    }
  }

  async function handleDeleteCommunity() {
    if (!community || membership?.role !== 'OWNER' || deletingCommunity) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${community.name}" permanently? Community content linked by deletion rules may also be removed. This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingCommunity(true);
    setCommunityActionError(null);

    try {
      await deleteCommunity(community.slug);
      window.location.assign('/my-community');
    } catch (error) {
      setCommunityActionError(
        error instanceof Error
          ? error.message
          : 'The community could not be deleted. Please try again.',
      );
      setDeletingCommunity(false);
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

      {!membershipLoading && membership?.status === 'ACTIVE' ? (
        <section
          aria-label="Community membership controls"
          style={{
            margin: '16px 0 20px',
            padding: 16,
            border: '1px solid #dfe7e2',
            borderRadius: 18,
            background: '#ffffff',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ fontWeight: 850 }}>
                {membership.role === 'OWNER'
                  ? 'Community owner controls'
                  : 'Your community membership'}
              </div>

              <div
                style={{
                  marginTop: 4,
                  color: '#68766f',
                  fontSize: 14,
                }}
              >
                {membership.role === 'OWNER'
                  ? 'Deleting this community is permanent and cannot be undone.'
                  : `Connected as ${
                      membership.role.charAt(0) + membership.role.slice(1).toLowerCase()
                    }.`}
              </div>
            </div>

            {membership.role === 'OWNER' ? (
              <button
                type="button"
                disabled={deletingCommunity}
                onClick={() => void handleDeleteCommunity()}
                style={{
                  minHeight: 42,
                  padding: '0 16px',
                  borderRadius: 999,
                  border: '1px solid #b42318',
                  background: '#fff',
                  color: '#b42318',
                  fontWeight: 800,
                  cursor: deletingCommunity ? 'default' : 'pointer',
                  opacity: deletingCommunity ? 0.6 : 1,
                }}
              >
                {deletingCommunity ? 'Deleting…' : 'Delete community'}
              </button>
            ) : (
              <button
                type="button"
                disabled={leavingCommunity}
                onClick={() => void handleLeaveCommunity()}
                style={{
                  minHeight: 42,
                  padding: '0 16px',
                  borderRadius: 999,
                  border: '1px solid #ccd7d0',
                  background: '#fff',
                  color: '#334139',
                  fontWeight: 800,
                  cursor: leavingCommunity ? 'default' : 'pointer',
                  opacity: leavingCommunity ? 0.6 : 1,
                }}
              >
                {leavingCommunity ? 'Leaving…' : 'Leave community'}
              </button>
            )}
          </div>

          {communityActionError ? (
            <div
              role="alert"
              style={{
                marginTop: 12,
                padding: '10px 12px',
                borderRadius: 12,
                background: '#fff4f2',
                color: '#b42318',
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {communityActionError}
            </div>
          ) : null}
        </section>
      ) : null}

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
