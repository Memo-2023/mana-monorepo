import { Controller, Post, Body } from '@nestjs/common';
import { GameSubmissionService } from './game-submission.service';
import { SubmitGameDto, SubmitGameResponseDto } from './dto/submit-game.dto';

@Controller('games')
export class GameSubmissionController {
	constructor(private readonly gameSubmissionService: GameSubmissionService) {}

	@Post('submit')
	async submitGame(@Body() dto: SubmitGameDto): Promise<SubmitGameResponseDto> {
		return this.gameSubmissionService.submitGame(dto);
	}
}
