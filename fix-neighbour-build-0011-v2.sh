#!/usr/bin/env bash
set -euo pipefail

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

SERVICE="services/api/src/message/message.service.ts"

if [[ ! -f "$SERVICE" ]]; then
  echo "Missing $SERVICE"
  exit 1
fi

echo "Applying resilient Build 0011 fixes..."

python3 - <<'PY'
from pathlib import Path

path = Path("services/api/src/message/message.service.ts")
text = path.read_text()

replacements = [
    (
        "        communityId: dto.communityId,\n",
        "        communityId: dto.communityId ?? null,\n",
        "communityId",
    ),
    (
        "          parentMessageId: dto.parentMessageId,\n",
        "          parentMessageId: dto.parentMessageId ?? null,\n",
        "parentMessageId",
    ),
    (
        "          clientNonce: dto.clientNonce,\n",
        "          clientNonce: dto.clientNonce ?? null,\n",
        "clientNonce",
    ),
    (
        "          metadata: dto.metadata as Prisma.InputJsonValue | undefined,\n",
        "          metadata: dto.metadata\n"
        "            ? (dto.metadata as Prisma.InputJsonValue)\n"
        "            : Prisma.JsonNull,\n",
        "metadata",
    ),
]

for old, new, label in replacements:
    if old in text:
        text = text.replace(old, new, 1)
        print(f"Fixed {label}.")
    elif new in text:
        print(f"{label} was already fixed.")
    else:
        raise SystemExit(f"Could not locate {label} assignment.")

old_attachments = """          attachments:
            attachments.length > 0
              ? {
                  create: attachments,
                }
              : undefined,
"""

new_attachments = """          ...(attachments.length > 0
            ? {
                attachments: {
                  create: attachments,
                },
              }
            : {}),
"""

if old_attachments in text:
    text = text.replace(old_attachments, new_attachments, 1)
    print("Fixed attachments.")
elif new_attachments in text:
    print("attachments were already fixed.")
else:
    raise SystemExit("Could not locate attachments assignment.")

path.write_text(text)
PY

echo "Formatting corrected source..."
pnpm format

echo "Running API type validation first..."
pnpm --filter @neighbour/api run lint

echo "Running complete validation pipeline..."
pnpm check

echo
echo "Neighbour™ Build 0011 completed successfully."
echo
echo "Commit with:"
echo '  git status'
echo '  git add .'
echo '  git commit -m "build: establish direct messaging engine"'
echo '  git push'
