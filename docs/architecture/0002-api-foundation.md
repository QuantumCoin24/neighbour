# Architecture Decision 0002 — API Foundation

## Status

Accepted.

## Context

Neighbour™ requires one shared backend serving the iPhone application and all web
experiences. The first backend increment must establish predictable configuration,
request validation, versioning, health reporting, error handling, testing and
Turborepo integration before domain modules are introduced.

## Decision

The shared API is implemented as a NestJS service under `services/api`.

The service provides:

- environment validation at startup;
- URI-based API versioning;
- the global `/api` prefix;
- strict DTO validation;
- centralised HTTP exception formatting;
- controlled CORS origins;
- graceful shutdown hooks;
- unit and end-to-end health checks;
- the versioned `GET /api/v1/health` endpoint.

## Consequences

All future API modules must:

1. live beneath `services/api/src`;
2. use versioned routes;
3. validate external input through DTOs;
4. return errors through the global exception boundary;
5. include automated tests;
6. pass the repository-wide `pnpm check` command.
