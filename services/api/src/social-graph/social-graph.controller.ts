import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import type {
  BlockResponse,
  ConnectionResponse,
  RelationshipStatusResponse,
} from './interfaces/social-graph-response.interface';
import { SocialGraphService } from './social-graph.service';

@Controller('connections')
export class SocialGraphController {
  constructor(private readonly socialGraphService: SocialGraphService) {}

  @Post('requests/:userId')
  sendRequest(
    @CurrentUser() user: AuthUser,
    @Param('userId') targetUserId: string,
  ): Promise<ConnectionResponse> {
    return this.socialGraphService.sendRequest(user.id, targetUserId);
  }

  @Post(':connectionId/accept')
  acceptRequest(
    @CurrentUser() user: AuthUser,
    @Param('connectionId') connectionId: string,
  ): Promise<ConnectionResponse> {
    return this.socialGraphService.acceptRequest(user.id, connectionId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post(':connectionId/decline')
  declineRequest(
    @CurrentUser() user: AuthUser,
    @Param('connectionId') connectionId: string,
  ): Promise<void> {
    return this.socialGraphService.declineRequest(user.id, connectionId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':connectionId/request')
  cancelRequest(
    @CurrentUser() user: AuthUser,
    @Param('connectionId') connectionId: string,
  ): Promise<void> {
    return this.socialGraphService.cancelRequest(user.id, connectionId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':connectionId')
  removeConnection(
    @CurrentUser() user: AuthUser,
    @Param('connectionId') connectionId: string,
  ): Promise<void> {
    return this.socialGraphService.removeConnection(user.id, connectionId);
  }

  @Get()
  listConnections(@CurrentUser() user: AuthUser): Promise<ConnectionResponse[]> {
    return this.socialGraphService.listConnections(user.id);
  }

  @Get('requests/incoming')
  listIncomingRequests(@CurrentUser() user: AuthUser): Promise<ConnectionResponse[]> {
    return this.socialGraphService.listIncomingRequests(user.id);
  }

  @Get('requests/outgoing')
  listOutgoingRequests(@CurrentUser() user: AuthUser): Promise<ConnectionResponse[]> {
    return this.socialGraphService.listOutgoingRequests(user.id);
  }

  @Get('relationship/:userId')
  getRelationshipStatus(
    @CurrentUser() user: AuthUser,
    @Param('userId') targetUserId: string,
  ): Promise<RelationshipStatusResponse> {
    return this.socialGraphService.getRelationshipStatus(user.id, targetUserId);
  }

  @Post('blocks/:userId')
  blockUser(
    @CurrentUser() user: AuthUser,
    @Param('userId') targetUserId: string,
  ): Promise<BlockResponse> {
    return this.socialGraphService.blockUser(user.id, targetUserId);
  }

  @Delete('blocks/:userId')
  unblockUser(
    @CurrentUser() user: AuthUser,
    @Param('userId') targetUserId: string,
  ): Promise<BlockResponse> {
    return this.socialGraphService.unblockUser(user.id, targetUserId);
  }
}
