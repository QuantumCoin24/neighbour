#!/usr/bin/env bash
set -euo pipefail

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

SERVICE="services/api/src/message/message.service.ts"

if [[ ! -f "$SERVICE" ]]; then
  echo "Missing $SERVICE"
  exit 1
fi

echo "Applying Build 0011 TypeScript/Prisma exact-optional fixes..."

python3 - <<'PY'
from pathlib import Path

path = Path("services/api/src/message/message.service.ts")
text = path.read_text()

old = """    const conversation = await this.database.conversation.create({
      data: {
        type: dto.type,
        title: dto.title?.trim() || null,
        ownerId: userId,
        communityId: dto.communityId,
        directKey,
        members: {
          create: memberIds.map((memberId) => ({
            userId: memberId,
            role:
              memberId === userId
                ? ConversationMemberRole.OWNER
                : ConversationMemberRole.MEMBER,
          })),
        },
      },
      include: conversationInclude,
    });

    return this.toConversationResponse(conversation);
"""

new = """    const conversationData: Prisma.ConversationCreateInput = {
      type: dto.type,
      title: dto.title?.trim() || null,
      owner: {
        connect: {
          id: userId,
        },
      },
      ...(dto.communityId
        ? {
            community: {
              connect: {
                id: dto.communityId,
              },
            },
          }
        : {}),
      directKey,
      members: {
        create: memberIds.map((memberId) => ({
          user: {
            connect: {
              id: memberId,
            },
          },
          role:
            memberId === userId
              ? ConversationMemberRole.OWNER
              : ConversationMemberRole.MEMBER,
        })),
      },
    };

    const conversation = await this.database.conversation.create({
      data: conversationData,
      include: conversationInclude,
    });

    return this.toConversationResponse(conversation);
"""

if old not in text:
    raise SystemExit("Could not locate conversation create block.")
text = text.replace(old, new, 1)

old = """    const message = await this.database.$transaction(async (transaction) => {
      const created = await transaction.message.create({
        data: {
          conversationId,
          senderId: userId,
          parentMessageId: dto.parentMessageId,
          type: dto.type,
          content,
          clientNonce: dto.clientNonce,
          metadata: dto.metadata as Prisma.InputJsonValue | undefined,
          attachments:
            attachments.length > 0
              ? {
                  create: attachments,
                }
              : undefined,
        },
        include: messageInclude,
      });
"""

new = """    const message = await this.database.$transaction(async (transaction) => {
      const messageData: Prisma.MessageCreateInput = {
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
      });
"""

if old not in text:
    raise SystemExit("Could not locate message create block.")
text = text.replace(old, new, 1)

path.write_text(text)
PY

echo "Formatting..."
pnpm format

echo "Running complete validation pipeline..."
pnpm check

echo
echo "Neighbour™ Build 0011 fix completed successfully."
echo
echo "Commit with:"
echo '  git status'
echo '  git add .'
echo '  git commit -m "build: establish direct messaging engine"'
echo '  git push'
