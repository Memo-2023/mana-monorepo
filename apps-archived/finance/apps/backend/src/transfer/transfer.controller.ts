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
import { JwtAuthGuard, CurrentUser, type CurrentUserData } from '@manacore/shared-nestjs-auth';
import { TransferService } from './transfer.service';
import { CreateTransferDto, UpdateTransferDto } from './dto';

@Controller('transfers')
@UseGuards(JwtAuthGuard)
export class TransferController {
	constructor(private readonly transferService: TransferService) {}

	@Get()
	findAll(@CurrentUser() user: CurrentUserData) {
		return this.transferService.findAll(user.userId);
	}

	@Get(':id')
	findOne(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		return this.transferService.findOne(user.userId, id);
	}

	@Post()
	create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateTransferDto) {
		return this.transferService.create(user.userId, dto);
	}

	@Put(':id')
	update(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateTransferDto
	) {
		return this.transferService.update(user.userId, id, dto);
	}

	@Delete(':id')
	delete(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		return this.transferService.delete(user.userId, id);
	}
}
