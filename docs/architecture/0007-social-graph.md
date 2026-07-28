# Neighbour™ Architecture Decision 0007

## Social Graph and Neighbour Connections

Build 0007 establishes the first version of the Neighbour™ social graph.

## Objectives

The social graph provides a controlled two-way connection relationship between
Neighbour members.

The module supports:

- sending a connection request;
- receiving incoming connection requests;
- viewing outgoing requests;
- accepting a request;
- declining a request;
- cancelling an outgoing request;
- removing an active connection;
- blocking another user;
- unblocking another user;
- retrieving the relationship status between two users;
- listing active connections.

## Canonical relationship pairs

Each connection stores two canonical user identifiers:

- `userAId`;
- `userBId`.

The identifiers are ordered consistently before the database operation is
performed. This allows the database to enforce one connection record per pair
regardless of which member initiated the relationship.

The `requestedById` field records which member initiated the current request.

## Connection states

A connection can be:

- `PENDING`;
- `CONNECTED`;
- `DECLINED`.

Declined records may later be reused when a new valid request is made.

## Blocking

Blocks are stored separately from connections.

A block:

- prevents either member from initiating a connection;
- removes any existing request or active connection between the pair;
- remains directional;
- can only be removed by the member who created it.

## Privacy

Connection responses return only safe public identity information:

- user identifier;
- display name;
- username;
- avatar URL;
- local area only where the user has enabled local-area visibility.

Email addresses, authentication data, account roles and private profile fields
are not returned.

## API routes

All routes require authentication.

### Requests

- `POST /api/v1/connections/requests/:userId`
- `GET /api/v1/connections/requests/incoming`
- `GET /api/v1/connections/requests/outgoing`
- `POST /api/v1/connections/:connectionId/accept`
- `POST /api/v1/connections/:connectionId/decline`
- `DELETE /api/v1/connections/:connectionId/request`

### Connections

- `GET /api/v1/connections`
- `DELETE /api/v1/connections/:connectionId`
- `GET /api/v1/connections/relationship/:userId`

### Blocks

- `POST /api/v1/connections/blocks/:userId`
- `DELETE /api/v1/connections/blocks/:userId`

## Future extensions

This foundation is intended to support:

- mutual-connection counts;
- connection recommendations;
- feed visibility;
- messaging permissions;
- event invitations;
- trusted-neighbour designations;
- community-based discovery;
- moderation and safety controls.
