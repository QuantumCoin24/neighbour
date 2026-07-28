# Build 0009 — Comments and Reactions

Build 0009 introduces the first interaction layer for Neighbour™ posts.

## Capabilities

- Create comments on visible posts
- Reply to an existing comment
- Retrieve comments with cursor pagination
- Edit comments as their author
- Soft-delete comments as their author
- Add or change one reaction per user per post
- Remove a reaction
- Retrieve reaction counts and the current viewer's reaction
- Enforce the existing post visibility rules before exposing interactions

## Reaction vocabulary

- `LIKE`
- `LOVE`
- `SUPPORT`
- `CELEBRATE`
- `INSIGHTFUL`

The reaction vocabulary is intentionally community-oriented and avoids negative
engagement mechanics in the initial platform release.

## API surface

```text
POST   /posts/:postId/comments
GET    /posts/:postId/comments
PATCH  /comments/:commentId
DELETE /comments/:commentId

PUT    /posts/:postId/reaction
DELETE /posts/:postId/reaction
GET    /posts/:postId/reactions
```

## Data model

`Comment` supports flat retrieval with an optional `parentId`, allowing clients
to construct threaded discussions without coupling the API to a specific visual
presentation.

`PostReaction` has a unique `(postId, userId)` constraint. A user can therefore
hold one current reaction per post, and changing reaction type is an idempotent
upsert operation.

## Integrity and permissions

- Interactions are available only when the requesting user can view the post.
- A reply must reference a live comment belonging to the same post.
- Only the comment author can edit or delete their comment.
- Deleted comments remain in storage for audit and moderation workflows but are
  excluded from the public interaction feed.
- Database cascades prevent orphaned comments and reactions when a post or user
  is permanently removed.
