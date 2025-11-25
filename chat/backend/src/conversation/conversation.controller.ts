import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { isOk } from '@manacore/shared-errors';
import {
  ConversationService,
  type Conversation,
  type Message,
} from './conversation.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserData,
} from '../common/decorators/current-user.decorator';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Get()
  async getConversations(
    @CurrentUser() user: CurrentUserData,
  ): Promise<Conversation[]> {
    const result = await this.conversationService.getConversations(user.userId);

    if (!isOk(result)) {
      throw result.error;
    }

    return result.value;
  }

  @Get(':id')
  async getConversation(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<Conversation> {
    // TODO: Add ownership check - ensure conversation belongs to user
    const result = await this.conversationService.getConversation(id);

    if (!isOk(result)) {
      throw result.error;
    }

    return result.value;
  }

  @Get(':id/messages')
  async getMessages(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<Message[]> {
    // TODO: Add ownership check - ensure conversation belongs to user
    const result = await this.conversationService.getMessages(id);

    if (!isOk(result)) {
      throw result.error;
    }

    return result.value;
  }

  @Post()
  async createConversation(
    @Body() body: { modelId: string; title?: string },
    @CurrentUser() user: CurrentUserData,
  ): Promise<Conversation> {
    const result = await this.conversationService.createConversation(
      user.userId,
      body.modelId,
      body.title,
    );

    if (!isOk(result)) {
      throw result.error;
    }

    return result.value;
  }

  @Post(':id/messages')
  async addMessage(
    @Param('id') id: string,
    @Body() body: { sender: 'user' | 'assistant' | 'system'; messageText: string },
    @CurrentUser() user: CurrentUserData,
  ): Promise<Message> {
    // TODO: Add ownership check - ensure conversation belongs to user
    const result = await this.conversationService.addMessage(
      id,
      body.sender,
      body.messageText,
    );

    if (!isOk(result)) {
      throw result.error;
    }

    return result.value;
  }
}
