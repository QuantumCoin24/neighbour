# Architecture Decision 0003 — Database Foundation

## Status

Accepted.

## Decision

Neighbour™ uses PostgreSQL as its primary relational data store and Prisma ORM as
its type-safe database access layer.

The initial domain establishes:

- users;
- communities;
- memberships;
- membership roles and lifecycle states.

A membership is unique for each user/community pair. Foreign-key deletion uses
cascading behaviour so orphaned memberships cannot remain.

## Local development

PostgreSQL runs through Docker Compose. Prisma migrations are committed to source
control and are the authoritative record of schema evolution.

## Runtime integration

`DatabaseService` owns the Prisma client lifecycle and is exported globally
through `DatabaseModule`.

The endpoint:

`GET /api/v1/health/database`

performs a live database query and reports PostgreSQL availability.

## Security boundary

The local password in `.env.example` is development-only. Production credentials
must be injected through the deployment platform and must never be committed.
