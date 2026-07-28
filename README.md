# Neighbour™

Neighbour™ is a community-first platform for a native iPhone application and a full-featured web platform.

## Version 1.0 platforms

- Native iPhone application
- Web platform
- Administration portal
- Business portal
- Organisation portal

Android is not part of Version 1.0.

## Architecture

Neighbour™ uses a monorepo with shared platform services and one source of truth:

- one backend
- one PostgreSQL/PostGIS database
- one API
- one authentication system
- one permissions engine
- one messaging engine
- one notification engine
- one search engine
- one maps engine
- one AI engine

## Prerequisites

- Node.js 24 or newer
- pnpm 11 or newer
- Docker Desktop
- Xcode for iPhone development

## Local setup

```bash
cp .env.example .env
pnpm install
docker compose up -d
pnpm dev
```

## Quality checks

```bash
pnpm check
```

## Repository structure

```text
apps/             User-facing applications
services/         Deployable backend services
packages/         Shared libraries and contracts
database/         Database migrations and seed data
infrastructure/   Deployment and operational configuration
docs/             Architecture and engineering documentation
tests/            Cross-service integration and end-to-end tests
```

## Security

Do not commit credentials, private keys, production environment files, user data, or secrets.

## Status

Build 0001.1 — production workspace bootstrap.
