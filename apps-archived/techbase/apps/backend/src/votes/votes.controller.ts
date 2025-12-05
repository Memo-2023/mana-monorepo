import { Controller, Post, Get, Body, Param, Req } from '@nestjs/common';
import { Request } from 'express';
import { VotesService } from './votes.service';
import { CreateVoteDto } from './dto/create-vote.dto';

@Controller('votes')
export class VotesController {
	constructor(private readonly votesService: VotesService) {}

	@Post()
	async createVote(@Body() createVoteDto: CreateVoteDto, @Req() req: Request) {
		const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
		return this.votesService.createVote(
			createVoteDto.softwareId,
			createVoteDto.metric,
			createVoteDto.rating,
			ipAddress
		);
	}

	@Get(':softwareId/metrics')
	async getMetrics(@Param('softwareId') softwareId: string) {
		return this.votesService.getAllMetrics(softwareId);
	}

	@Get(':softwareId/metrics/:metric')
	async getMetricByName(@Param('softwareId') softwareId: string, @Param('metric') metric: string) {
		return this.votesService.getMetrics(softwareId, metric);
	}
}
