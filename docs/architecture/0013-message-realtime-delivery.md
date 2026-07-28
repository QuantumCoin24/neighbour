# Architecture 0013 — Message Realtime Delivery

## Status

Accepted.

## Context

Neighbour™ provides persistent direct and group messaging through the HTTP API
and authenticated realtime transport through Socket.IO.

Successful messaging mutations are propagated to active conversation
participants without weakening existing identity, membership, database or
authorisation boundaries.

## Decision

The message domain publishes realtime events only after the corresponding
database operation succeeds.

`MessageService` delegates realtime delivery to
`MessageRealtimePublisher`.

The publisher emits each event to:

1. the deterministic conversation room;
2. the deterministic private user room of every active conversation member.

Members whose `leftAt` value is not null are excluded from user-targeted
fan-out.

## Event contract

The integration publishes:

- `message.created`
- `message.updated`
- `message.deleted`
- `message.read`
- `conversation.updated`

Every delivery uses an envelope containing `event`, `occurredAt` and `data`.

Realtime events are low-latency notifications rather than the system of
record. Clients may reconcile against the HTTP API after reconnecting.

## Verification

Automated tests verify conversation-room delivery, active-member fan-out,
departed-member exclusion, envelope structure, lifecycle events and shared
payload consistency across recipients.
