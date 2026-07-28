# Build 0011 — Direct Messaging Engine

Build 0011 establishes the shared communication engine for Neighbour™.

## Models

- `Conversation`
- `ConversationMember`
- `Message`
- `MessageAttachment`
- `MessageReadReceipt`

Notifications now support `MESSAGE`, `conversationId` and `messageId`.

## API

- `POST /api/v1/messages/conversations`
- `GET /api/v1/messages/conversations`
- `GET /api/v1/messages/conversations/:conversationId`
- `PATCH /api/v1/messages/conversations/:conversationId`
- `POST /api/v1/messages/conversations/:conversationId/messages`
- `GET /api/v1/messages/conversations/:conversationId/messages`
- `POST /api/v1/messages/conversations/:conversationId/read`
- `PATCH /api/v1/messages/:messageId`
- `DELETE /api/v1/messages/:messageId`

## Invariants

Direct threads use a canonical key to prevent duplicates. Membership gates every
read and write. Message creation, last-message state, unread counters and
notifications are committed transactionally. Client nonces make retries
idempotent. Deletion is soft and preserves timeline position. Attachment
metadata is storage-provider neutral for Build 0013.

Build 0012 will publish message and read-state changes through WebSockets.
