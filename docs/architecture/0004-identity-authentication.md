# Build 0004 — Identity and Authentication Foundation

Build 0004 establishes Neighbour™ platform identity and API authentication.

## Capabilities

- Email and password registration
- Argon2id password hashing
- Login with generic credential failure responses
- Short-lived JWT access tokens
- Rotating, server-recorded refresh tokens
- SHA-256 refresh-token storage
- Refresh-token revocation and logout
- Protected `/api/v1/auth/me` endpoint
- Platform roles and reusable role guard
- User account status enforcement
- Email-verification data field reserved for the later mail-delivery build

## Security model

Passwords are never stored directly. Refresh tokens are returned to the client once and persisted only as hashes. Each successful refresh revokes the previous refresh token and issues a new token pair. Access tokens and refresh tokens use independent signing secrets.

## Endpoints

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

The health endpoints remain public.
