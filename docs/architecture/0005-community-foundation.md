# Build 0005 — Community Foundation

## Purpose

Build 0005 introduces the first core Neighbour™ application domain:
communities and community membership.

## Capabilities

- Authenticated users can create communities.
- A community creator becomes its owner automatically.
- Public communities can be listed without authentication.
- Public communities can be viewed by slug.
- Authenticated users can list their own memberships.
- Authenticated users can join public communities.
- Duplicate active memberships are rejected.
- Blocked users cannot rejoin.
- Former members may reactivate a membership.
- Community names are converted into unique URL-safe slugs.

## API routes

| Method | Route                            | Access        |
| ------ | -------------------------------- | ------------- |
| POST   | `/api/v1/communities`            | Authenticated |
| GET    | `/api/v1/communities`            | Public        |
| GET    | `/api/v1/communities/mine`       | Authenticated |
| GET    | `/api/v1/communities/:slug`      | Public        |
| POST   | `/api/v1/communities/:slug/join` | Authenticated |

## Data model

Build 0005 uses the existing Prisma models:

- `Community`
- `Membership`
- `User`

Each user/community relationship remains protected by the compound unique
constraint on `userId` and `communityId`.

## Ownership

Community creation performs two connected actions:

1. Creates the community.
2. Creates an active owner membership for the authenticated creator.

The nested Prisma write ensures both records are created atomically.

## Validation

Community names must contain between 3 and 100 characters.

Descriptions are optional and limited to 1,000 characters.

Visibility must use a supported `CommunityVisibility` enum value.

## Testing

Build 0005 adds automated tests for:

- Community DTO normalisation.
- Invalid community names.
- URL-safe slug generation.
- Ampersand handling.
- Punctuation removal.
- Fallback slug generation.
