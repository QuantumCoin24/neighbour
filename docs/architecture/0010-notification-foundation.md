# Build 0010 — Notification Foundation

Build 0010 establishes the shared in-app notification engine for Neighbour™.

## Capabilities

- Persistent notification inbox
- Cursor pagination
- Optional unread-only filtering
- Unread counter
- Mark one notification as read
- Mark all notifications as read
- Dismiss notifications without immediately deleting their audit record
- Idempotent notification creation
- Automatic comment and reaction notifications
- Automatic removal of reaction notifications when a reaction is withdrawn

## API surface

```text
GET    /notifications
GET    /notifications/unread-count
PATCH  /notifications/read-all
PATCH  /notifications/:notificationId/read
DELETE /notifications/:notificationId
```

## Initial event vocabulary

```text
COMMENT
REPLY
REACTION
CONNECTION_REQUEST
CONNECTION_ACCEPTED
COMMUNITY_INVITE
COMMUNITY_ROLE_CHANGED
SYSTEM
```

Only comment, reply, and reaction events are emitted in Build 0010. The remaining
types reserve a stable contract for later social graph, community administration,
and platform operations integrations.

## Delivery model

Build 0010 provides the canonical in-app inbox. Push delivery, email delivery,
and user notification preferences will attach to this same notification record
in later builds rather than creating parallel notification systems.

## Idempotency

Every notification has a unique `idempotencyKey`.

- Comment notifications use the comment identifier.
- Reaction notifications use the post and actor identifiers.
- Changing a reaction refreshes the existing notification.
- Removing a reaction removes its corresponding notification.

## Privacy and permissions

- Inbox records are scoped to the authenticated recipient.
- Read and dismissal operations require recipient ownership.
- Self-generated comment and reaction notifications are suppressed.
- Notification actors are nullable so an account can later be removed while
  retaining an operational or audit notification record.
