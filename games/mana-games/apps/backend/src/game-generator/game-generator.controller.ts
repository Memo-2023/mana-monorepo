import { Controller, Post, Body } from '@nestjs/common';
import { GameGeneratorService } from './game-generator.service';
import { GenerateGameDto, GenerateGameResponseDto } from './dto/generate-game.dto';

@Controller('games')
export class GameGeneratorController {
	constructor(private readonly gameGeneratorService: GameGeneratorService) {}

	@Post('generate')
	async generateGame(@Body() dto: GenerateGameDto): Promise<GenerateGameResponseDto> {
		return this.gameGeneratorService.generateGame(dto);
	}
}
