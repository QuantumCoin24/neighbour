import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { ConversationQueryDto } from './dto/conversation-query.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageQueryDto } from './dto/message-query.dto';
import { UpdateConversationStateDto } from './dto/update-conversation-state.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import type {
  ConversationFeedResponse,
  ConversationResponse,
  MessageFeedResponse,
  MessageResponse,
} from './interfaces/message-response.interface';
import { MessageService } from './message.service';

@Controller('messages')
export class MessageController {
  constructor(private readonly service: MessageService) {}

  @Post('conversations')
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateConversationDto,
  ): Promise<ConversationResponse> {
    return this.service.createConversation(user.id, dto);
  }

  @Get('conversations')
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: ConversationQueryDto,
  ): Promise<ConversationFeedResponse> {
    return this.service.listConversations(user.id, query);
  }

  @Get('conversations/:conversationId')
  get(
    @CurrentUser() user: AuthUser,
    @Param('conversationId') id: string,
  ): Promise<ConversationResponse> {
    return this.service.getConversation(user.id, id);
  }

  @Patch('conversations/:conversationId')
  state(
    @CurrentUser() user: AuthUser,
    @Param('conversationId') id: string,
    @Body() dto: UpdateConversationStateDto,
  ): Promise<ConversationResponse> {
    return this.service.updateState(user.id, id, dto);
  }

  @Post('conversations/:conversationId/messages')
  send(
    @CurrentUser() user: AuthUser,
    @Param('conversationId') id: string,
    @Body() dto: CreateMessageDto,
  ): Promise<MessageResponse> {
    return this.service.sendMessage(user.id, id, dto);
  }

  @Get('conversations/:conversationId/messages')
  messages(
    @CurrentUser() user: AuthUser,
    @Param('conversationId') id: string,
    @Query() query: MessageQueryDto,
  ): Promise<MessageFeedResponse> {
    return this.service.listMessages(user.id, id, query);
  }

  @Post('conversations/:conversationId/read')
  read(
    @CurrentUser() user: AuthUser,
    @Param('conversationId') id: string,
    @Body() body: { messageId?: string },
  ): Promise<{ unreadCount: number; lastReadAt: Date }> {
    return this.service.markRead(user.id, id, body.messageId);
  }

  @Patch(':messageId')
  edit(
    @CurrentUser() user: AuthUser,
    @Param('messageId') id: string,
    @Body() dto: UpdateMessageDto,
  ): Promise<MessageResponse> {
    return this.service.editMessage(user.id, id, dto);
  }

  @Delete(':messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param('messageId') id: string): Promise<void> {
    return this.service.deleteMessage(user.id, id);
  }
}
