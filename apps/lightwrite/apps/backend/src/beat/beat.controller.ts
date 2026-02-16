import {
	Controller,
	Get,
	Post,
	Put,
	Delete,
	Body,
	Param,
	UseGuards,
	ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { BeatService } from './beat.service';
import { CreateBeatUploadDto, UpdateBeatMetadataDto } from './dto/beat.dto';

@Controller('beats')
@UseGuards(JwtAuthGuard)
export class BeatController {
	constructor(private readonly beatService: BeatService) {}

	@Get('project/:projectId')
	async findByProject(
		@CurrentUser() user: CurrentUserData,
		@Param('projectId', ParseUUIDPipe) projectId: string
	) {
		await this.beatService.verifyProjectOwnership(projectId, user.userId);
		const beat = await this.beatService.findByProjectId(projectId);
		return { beat };
	}

	@Get(':id')
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		const beat = await this.beatService.findByIdOrThrow(id);
		await this.beatService.verifyProjectOwnership(beat.projectId, user.userId);
		const beatMarkers = await this.beatService.getMarkersForBeat(id);
		return { beat, markers: beatMarkers };
	}

	@Get(':id/download-url')
	async getDownloadUrl(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string
	) {
		const url = await this.beatService.getDownloadUrl(id, user.userId);
		return { url };
	}

	@Post('upload')
	async createUploadUrl(@CurrentUser() user: CurrentUserData, @Body() dto: CreateBeatUploadDto) {
		const result = await this.beatService.createUploadUrl(dto.projectId, user.userId, dto.filename);
		return result;
	}

	@Put(':id/metadata')
	async updateMetadata(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateBeatMetadataDto
	) {
		const beat = await this.beatService.updateBeatMetadata(id, user.userId, dto);
		return { beat };
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		await this.beatService.delete(id, user.userId);
		return { success: true };
	}
}
