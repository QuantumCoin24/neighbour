# Architecture Decision 0001: Platform foundation

## Status

Accepted.

## Decision

Neighbour™ Version 1.0 will ship as a native iPhone application and a full-featured web platform. Android is excluded from Version 1.0.

The platform will use:

- SwiftUI for the native iPhone client
- Next.js and TypeScript for web clients
- NestJS and TypeScript for backend services
- PostgreSQL with PostGIS as the canonical database
- Redis for caching, queues and realtime coordination
- S3-compatible storage for media assets
- OpenSearch for indexed and semantic discovery

## Constraint

Every module must integrate with shared identity, permissions, messaging, notifications, search, maps and AI services. Parallel sources of truth are prohibited.

## Consequence

Client applications may differ in presentation, but business rules, validation, authorisation and canonical data remain server-governed.
