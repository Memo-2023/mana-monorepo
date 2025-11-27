import { Module } from '@nestjs/common';
import { TranscriptionController } from './transcription.controller';
import { TranscriptionService } from './transcription.service';
import { YoutubeModule } from '../youtube/youtube.module';
import { WhisperModule } from '../whisper/whisper.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [YoutubeModule, WhisperModule, WebsocketModule],
  controllers: [TranscriptionController],
  providers: [TranscriptionService],
  exports: [TranscriptionService],
})
export class TranscriptionModule {}
