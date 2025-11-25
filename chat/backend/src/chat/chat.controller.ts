import { Body, Controller, Get, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatCompletionDto, ChatCompletionResponseDto } from './dto/chat-completion.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('models')
  getModels() {
    return this.chatService.getAvailableModels();
  }

  @Post('completions')
  async createCompletion(
    @Body() dto: ChatCompletionDto,
  ): Promise<ChatCompletionResponseDto> {
    return this.chatService.createCompletion(dto);
  }
}
