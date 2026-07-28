import 'reflect-metadata';

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { ConversationType, MessageType } from '../src/generated/prisma/client';
import { CreateConversationDto } from '../src/message/dto/create-conversation.dto';
import { CreateMessageDto } from '../src/message/dto/create-message.dto';

describe('Build 0011 messaging DTO validation', () => {
  it('accepts a valid direct conversation request', async () => {
    const dto = plainToInstance(CreateConversationDto, {
      type: ConversationType.DIRECT,
      memberIds: ['0dce56de-d06f-4bfd-b6d1-f5387f642f2a'],
    });

    const errors = await validate(dto);
    assert.equal(errors.length, 0);
  });

  it('rejects an invalid conversation member identifier', async () => {
    const dto = plainToInstance(CreateConversationDto, {
      type: ConversationType.GROUP,
      memberIds: ['not-a-uuid'],
    });

    const errors = await validate(dto);
    assert.ok(errors.length > 0);
  });

  it('accepts message content and attachment metadata', async () => {
    const dto = plainToInstance(CreateMessageDto, {
      type: MessageType.FILE,
      content: 'Local planning document',
      clientNonce: 'ios-0011-demo',
      attachments: [
        {
          storageKey: 'messages/demo/file.pdf',
          fileName: 'file.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 2048,
        },
      ],
    });

    const errors = await validate(dto);
    assert.equal(errors.length, 0);
  });
});
