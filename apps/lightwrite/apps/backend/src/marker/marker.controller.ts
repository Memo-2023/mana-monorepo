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
import { MarkerService } from './marker.service';
import {
	CreateMarkerDto,
	UpdateMarkerDto,
	BulkCreateMarkersDto,
	BulkUpdateMarkersDto,
} from './dto/marker.dto';

@Controller('markers')
@UseGuards(JwtAuthGuard)
export class MarkerController {
	constructor(private readonly markerService: MarkerService) {}

	@Get('beat/:beatId')
	async findByBeat(
		@CurrentUser() user: CurrentUserData,
		@Param('beatId', ParseUUIDPipe) beatId: string
	) {
		await this.markerService.verifyBeatOwnership(beatId, user.userId);
		const markerList = await this.markerService.findByBeatId(beatId);
		return { markers: markerList };
	}

	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateMarkerDto) {
		await this.markerService.verifyBeatOwnership(dto.beatId, user.userId);
		const marker = await this.markerService.create(dto);
		return { marker };
	}

	@Post('bulk')
	async bulkCreate(@CurrentUser() user: CurrentUserData, @Body() dto: BulkCreateMarkersDto) {
		const markerList = await this.markerService.bulkCreate(dto.beatId, user.userId, dto.markers);
		return { markers: markerList };
	}

	@Put('bulk')
	async bulkUpdate(@CurrentUser() user: CurrentUserData, @Body() dto: BulkUpdateMarkersDto) {
		const markerList = await this.markerService.bulkUpdate(user.userId, dto.updates);
		return { markers: markerList };
	}

	@Put(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateMarkerDto
	) {
		const marker = await this.markerService.update(id, user.userId, dto);
		return { marker };
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		await this.markerService.delete(id, user.userId);
		return { success: true };
	}

	@Delete('beat/:beatId')
	async deleteAllForBeat(
		@CurrentUser() user: CurrentUserData,
		@Param('beatId', ParseUUIDPipe) beatId: string
	) {
		await this.markerService.deleteAllForBeat(beatId, user.userId);
		return { success: true };
	}
}
