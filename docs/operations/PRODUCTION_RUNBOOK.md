# Neighbour Production Runbook

## Health endpoints

- GET /api/v1/health — application health
- GET /api/v1/live — process liveness
- GET /api/v1/ready — database and configuration readiness

## Deployment gate

Run these commands before deployment:

    pnpm production:check
    pnpm check
    pnpm --filter @neighbour/api db:deploy

## Incident response

1. Capture the X-Request-ID response header.
2. Search structured API logs for the request ID.
3. Check /api/v1/ready.
4. Check PostgreSQL health.
5. Review realtime and notification delivery metrics.
6. Roll back when service health cannot be restored promptly.

## Graceful shutdown

The API enables Nest shutdown hooks. Production process managers must send
SIGTERM and allow the process time to drain before force termination.

## Database recovery

Database backups must be tested through a restore rehearsal. A backup is not
considered valid until it has been restored successfully in an isolated
environment.
