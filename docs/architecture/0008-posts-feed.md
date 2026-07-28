# Neighbour™ Architecture Decision 0008

## Posts and Community Feed

Build 0008 establishes the first content publishing and feed layer for
Neighbour™.

## Objectives

The post engine supports:

- personal posts;
- community posts;
- optional post titles;
- draft and published states;
- editing;
- soft deletion;
- privacy-aware visibility;
- personal feeds;
- community feeds;
- profile post lists;
- cursor pagination.

## Post states

A post can be:

- `DRAFT`;
- `PUBLISHED`.

Draft posts are visible only to their author.

Publishing a draft assigns a `publishedAt` timestamp. Returning a published post
to draft state removes its publication timestamp.

## Post visibility

A post can use one of four visibility levels:

- `PUBLIC`;
- `CONNECTIONS`;
- `COMMUNITY`;
- `PRIVATE`.

### Public

Visible to authenticated Neighbour members.

### Connections

Visible to the author and users with an accepted two-way connection to the
author.

### Community

Visible to active members of the attached community.

### Private

Visible only to the author.

## Community posting

A user must hold an active membership in a community before creating or moving
a post into that community.

Community-only visibility requires a valid community.

Community posts cannot use connection-only visibility because community access
and social-graph access are separate permission domains.

## Feed composition

The main feed may contain:

- the current user's own published posts;
- public posts;
- connection-only posts created by accepted connections;
- community-only posts from communities where the user has active membership.

Drafts and soft-deleted posts are excluded.

## Community feed

A public community feed can be viewed by authenticated users, but non-members
receive only public posts.

Private community feeds require active membership.

Active members may receive both public and community-only posts.

## Profile posts

A profile post list provides:

- public published posts for ordinary viewers;
- connection-only posts for accepted connections;
- all undeleted posts, including drafts, for the profile owner.

## Soft deletion

Deleting a post sets `deletedAt`.

The database record remains available for future moderation, audit and recovery
systems, but normal post and feed queries exclude it.

## Cursor pagination

Feeds use post identifiers as Prisma cursors.

Each query retrieves one additional record beyond the requested page size. The
additional record determines whether a `nextCursor` should be returned.

Page sizes are restricted to between 1 and 50 posts.

## Privacy

Post responses expose only safe author information:

- user identifier;
- display name;
- username;
- avatar reference;
- local area only where local-area visibility is enabled.

Email addresses, authentication credentials, account roles and private user
data are excluded.

## API routes

All routes require authentication.

### Post management

- `POST /api/v1/posts`
- `GET /api/v1/posts/drafts`
- `GET /api/v1/posts/:postId`
- `PATCH /api/v1/posts/:postId`
- `DELETE /api/v1/posts/:postId`

### Feeds

- `GET /api/v1/feed`
- `GET /api/v1/communities/:slug/feed`
- `GET /api/v1/profiles/:username/posts`

## Future extensions

This foundation is intended to support:

- images and video;
- reactions;
- comments;
- post sharing;
- mentions;
- hashtags;
- feed ranking;
- moderation queues;
- reporting;
- pinned posts;
- scheduled publication;
- local-area feeds;
- business posts;
- sponsored content.
