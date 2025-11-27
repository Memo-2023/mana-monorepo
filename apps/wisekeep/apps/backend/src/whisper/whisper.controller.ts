import { Controller, Get } from '@nestjs/common';
import { WhisperService } from './whisper.service';

@Controller('whisper')
export class WhisperController {
  constructor(private readonly whisperService: WhisperService) {}

  @Get('models')
  getModels() {
    return {
      models: this.whisperService.getAvailableModels(),
      defaultProvider: this.whisperService.getDefaultProvider(),
      defaultModel: this.whisperService.getDefaultModel(),
      groqAvailable: this.whisperService.isGroqAvailable(),
    };
  }
}
