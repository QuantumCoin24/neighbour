# Build 0006 — User Profiles and Neighbour Identity

## Purpose

Build 0006 separates public Neighbour™ identity from authentication data.

Authentication records remain responsible for:

- Email
- Password hash
- Platform role
- Account status
- Token relationships

The new profile record is responsible for:

- Public username
- Display name presentation
- Biography
- Avatar reference
- Local-area information
- Location visibility preference

## Data model

Each user may have exactly one `UserProfile`.

The profile uses:

- A unique `userId`
- A unique public `username`
- Cascade deletion when the user is deleted
- Optional biography, avatar URL and local area
- A `showLocalArea` privacy control

## Profile creation

Profiles are created lazily.

When an authenticated user requests `/api/v1/profiles/me` for the first
time, the API creates a profile automatically using a generated username.

The generated username combines:

1. A normalised form of the display name.
2. A short stable portion of the user ID.

## Privacy

Private profile responses include:

- Local area
- Location visibility preference

Public responses never include:

- Email address
- Password hash
- Authentication tokens
- Platform role
- Account administration data
- Hidden local-area information

When `showLocalArea` is false, the public `localArea` value is returned
as `null`.

## API routes

| Method | Route                        | Access        |
| ------ | ---------------------------- | ------------- |
| GET    | `/api/v1/profiles/me`        | Authenticated |
| PATCH  | `/api/v1/profiles/me`        | Authenticated |
| GET    | `/api/v1/profiles/:username` | Public        |

## Validation

Usernames:

- Must contain between 3 and 30 characters.
- Are stored in lowercase.
- May contain letters, numbers, full stops and underscores.
- Cannot start or end with punctuation.
- Must be globally unique.

Biographies are limited to 500 characters.

Local-area descriptions are limited to 100 characters.

Avatar references must be valid HTTP or HTTPS URLs.

## Future extension

The profile domain will later support:

- Uploaded avatar assets
- Verification badges
- Community contribution summaries
- Neighbour reputation
- Business identity links
- Profile blocking
- Profile reporting
