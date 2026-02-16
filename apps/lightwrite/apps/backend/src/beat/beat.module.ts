import { Module } from '@nestjs/common';
import { BeatController } from './beat.controller';
import { BeatService } from './beat.service';

@Module({
	controllers: [BeatController],
	providers: [BeatService],
	exports: [BeatService],
})
export class BeatModule {}
