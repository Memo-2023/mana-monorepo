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
import { CreateBeatUploadDto, UpdateBeatMetadataDto, UseLibraryBeatDto } from './dto/beat.dto';

@Controller('beats')
export class BeatController {
	constructor(private readonly beatService: BeatService) {}

	// ==================== Library Beats (Public) ====================

	@Get('library')
	async getLibraryBeats() {
		const beats = await this.beatService.getLibraryBeats();
		return { beats };
	}

	@Get('library/:id')
	async getLibraryBeat(@Param('id', ParseUUIDPipe) id: string) {
		const beat = await this.beatService.getLibraryBeatById(id);
		if (!beat) {
			return { beat: null };
		}
		return { beat };
	}

	@Get('library/:id/download-url')
	async getLibraryBeatDownloadUrl(@Param('id', ParseUUIDPipe) id: string) {
		const url = await this.beatService.getLibraryBeatDownloadUrl(id);
		return { url };
	}

	@Post('library/:id/use')
	@UseGuards(JwtAuthGuard)
	async useLibraryBeat(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UseLibraryBeatDto
	) {
		const beat = await this.beatService.useLibraryBeat(id, dto.projectId, user.userId);
		return { beat };
	}

	// ==================== STT Transcription ====================

	@Get('stt/available')
	async getSttAvailability() {
		const available = await this.beatService.isSttAvailable();
		return { available };
	}

	// ==================== User Beats (Protected) ====================

	@Get('project/:projectId')
	@UseGuards(JwtAuthGuard)
	async findByProject(
		@CurrentUser() user: CurrentUserData,
		@Param('projectId', ParseUUIDPipe) projectId: string
	) {
		await this.beatService.verifyProjectOwnership(projectId, user.userId);
		const beat = await this.beatService.findByProjectId(projectId);
		return { beat };
	}

	@Get(':id')
	@UseGuards(JwtAuthGuard)
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		const beat = await this.beatService.findByIdOrThrow(id);
		await this.beatService.verifyProjectOwnership(beat.projectId, user.userId);
		const beatMarkers = await this.beatService.getMarkersForBeat(id);
		return { beat, markers: beatMarkers };
	}

	@Get(':id/download-url')
	@UseGuards(JwtAuthGuard)
	async getDownloadUrl(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string
	) {
		const url = await this.beatService.getDownloadUrl(id, user.userId);
		return { url };
	}

	@Post('upload')
	@UseGuards(JwtAuthGuard)
	async createUploadUrl(@CurrentUser() user: CurrentUserData, @Body() dto: CreateBeatUploadDto) {
		const result = await this.beatService.createUploadUrl(dto.projectId, user.userId, dto.filename);
		return result;
	}

	@Put(':id/metadata')
	@UseGuards(JwtAuthGuard)
	async updateMetadata(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateBeatMetadataDto
	) {
		const beat = await this.beatService.updateBeatMetadata(id, user.userId, dto);
		return { beat };
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	async delete(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		await this.beatService.delete(id, user.userId);
		return { success: true };
	}

	@Post(':id/transcribe')
	@UseGuards(JwtAuthGuard)
	async transcribeBeat(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string
	) {
		const result = await this.beatService.transcribeBeat(id, user.userId);
		return result;
	}
}
