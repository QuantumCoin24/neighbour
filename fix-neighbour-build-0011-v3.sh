#!/usr/bin/env bash
set -euo pipefail

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

SERVICE="services/api/src/message/message.service.ts"

if [[ ! -f "$SERVICE" ]]; then
  echo "Missing $SERVICE"
  exit 1
fi

echo "Applying Build 0011 Fix V3..."

python3 - <<'PY'
from pathlib import Path
import re

path = Path("services/api/src/message/message.service.ts")
text = path.read_text()

# Ensure nullable Prisma scalar values are explicit.
scalar_fixes = {
    "communityId: dto.communityId,": "communityId: dto.communityId ?? null,",
    "parentMessageId: dto.parentMessageId,": "parentMessageId: dto.parentMessageId ?? null,",
    "clientNonce: dto.clientNonce,": "clientNonce: dto.clientNonce ?? null,",
}

for old, new in scalar_fixes.items():
    if old in text:
        text = text.replace(old, new, 1)

# Replace the full message create section structurally, independent of Prettier layout.
pattern = re.compile(
    r"""      const created = await transaction\.message\.create\(\{\s*
        data:\s*\{.*?\},\s*
        include:\s*messageInclude,\s*
      \}\);""",
    re.DOTALL | re.VERBOSE,
)

replacement = """      const messageData: Prisma.MessageCreateInput = {
        conversation: {
          connect: {
            id: conversationId,
          },
        },
        sender: {
          connect: {
            id: userId,
          },
        },
        type: dto.type,
        content,
        ...(dto.parentMessageId
          ? {
              parentMessage: {
                connect: {
                  id: dto.parentMessageId,
                },
              },
            }
          : {}),
        ...(dto.clientNonce
          ? {
              clientNonce: dto.clientNonce,
            }
          : {}),
        ...(dto.metadata
          ? {
              metadata: dto.metadata as Prisma.InputJsonValue,
            }
          : {}),
        ...(attachments.length > 0
          ? {
              attachments: {
                create: attachments,
              },
            }
          : {}),
      };

      const created = await transaction.message.create({
        data: messageData,
        include: messageInclude,
      });"""

if "const messageData: Prisma.MessageCreateInput" not in text:
    text, count = pattern.subn(replacement, text, count=1)
    if count != 1:
        raise SystemExit(
            "Could not structurally locate the transaction message.create block."
        )
    print("Rebuilt message create input.")
else:
    print("Message create input was already rebuilt.")

path.write_text(text)
PY

echo "Formatting..."
pnpm format

echo "Running API TypeScript validation..."
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
