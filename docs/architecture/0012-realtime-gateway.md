# Architecture 0012 — Realtime Gateway

## Status

Accepted.

## Summary

Build 0012 introduces the authenticated realtime foundation for
Neighbour™ using NestJS WebSockets and Socket.IO.

### Authentication

- JWT authentication for every socket
- Token accepted via Socket.IO auth payload or Bearer header
- Socket stores authenticated user
- Invalid sockets disconnect immediately

### Rooms

Deterministic room names:

- user:<userId>
- conversation:<conversationId>
- community:<communityId>
- business:<businessId>
- organisation:<organisationId>
- event:<eventId>

Conversation membership is validated before joining.

### Presence

Presence is tracked per user.

Users become online when their first socket connects and offline only
after their final socket disconnects.

### Heartbeat

Clients emit:

heartbeat

Server responds:

heartbeat.acknowledged

including:

- socket id
- user id
- acknowledgement timestamp
- optional client timestamp

### Typing

Supported events:

- typing.start
- typing.stop

Typing expires automatically after five seconds and is cleared on room
leave or disconnect.

### Event Contract

RealtimeEvents centralises all public event names including:

- connection
- heartbeat
- rooms
- presence
- typing
- messaging
- notifications

### Verification

Validated using:

- pnpm format
- lint
- tests
- build

### Outcome

Build 0012 provides the realtime foundation required for messaging,
presence, notifications and future live platform services.
