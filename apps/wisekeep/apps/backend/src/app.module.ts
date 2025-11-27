import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TranscriptionModule } from './transcription/transcription.module';
import { PlaylistModule } from './playlist/playlist.module';
import { YoutubeModule } from './youtube/youtube.module';
import { WhisperModule } from './whisper/whisper.module';
import { WebsocketModule } from './websocket/websocket.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TranscriptionModule,
    PlaylistModule,
    YoutubeModule,
    WhisperModule,
    WebsocketModule,
    HealthModule,
  ],
})
export class AppModule {}
