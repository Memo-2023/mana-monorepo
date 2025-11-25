import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ConversationService } from './conversation.service';

@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Get()
  async getConversations(@Query('userId') userId: string) {
    return this.conversationService.getConversations(userId);
  }

  @Get(':id')
  async getConversation(@Param('id') id: string) {
    return this.conversationService.getConversation(id);
  }

  @Get(':id/messages')
  async getMessages(@Param('id') id: string) {
    return this.conversationService.getMessages(id);
  }

  @Post()
  async createConversation(
    @Body() body: { userId: string; modelId: string; title?: string },
  ) {
    return this.conversationService.createConversation(
      body.userId,
      body.modelId,
      body.title,
    );
  }

  @Post(':id/messages')
  async addMessage(
    @Param('id') id: string,
    @Body() body: { sender: 'user' | 'assistant' | 'system'; messageText: string },
  ) {
    return this.conversationService.addMessage(id, body.sender, body.messageText);
  }
}
