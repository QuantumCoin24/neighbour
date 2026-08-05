# Neighbour™ 1.0.0-rc.1 Release Checklist

## Repository

- [ ] Working tree clean
- [ ] Main branch current
- [ ] All versions synchronised
- [ ] Release manifest present
- [ ] Release notes present
- [ ] Rollback manifest present

## Quality

- [ ] Format check passes
- [ ] Lint passes
- [ ] Typecheck passes
- [ ] Tests pass
- [ ] Build passes

## Database

- [ ] Prisma schema validates
- [ ] Prisma client generates
- [ ] Migrations deploy cleanly
- [ ] Database readiness passes

## API

- [ ] Health endpoint returns 200
- [ ] Liveness endpoint returns 200
- [ ] Readiness endpoint returns READY
- [ ] Security headers present
- [ ] Request ID present
- [ ] Rate-limit headers present

## Mobile

- [ ] Expo version is 1.0.0-rc.1
- [ ] iOS bundle identifier confirmed
- [ ] EAS project ID confirmed
- [ ] Encryption declaration confirmed
- [ ] Production build profile confirmed

## Web

- [ ] Production build passes
- [ ] Environment variables validated
- [ ] Deployment target confirmed
- [ ] Error and fallback routes checked

## Release

- [ ] Release commit created
- [ ] Tag v1.0.0-rc.1 created
- [ ] Tag pushed
- [ ] Release candidate approved
