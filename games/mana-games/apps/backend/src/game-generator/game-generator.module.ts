import { Module } from '@nestjs/common';
import { GameGeneratorController } from './game-generator.controller';
import { GameGeneratorService } from './game-generator.service';

@Module({
	controllers: [GameGeneratorController],
	providers: [GameGeneratorService],
})
export class GameGeneratorModule {}
