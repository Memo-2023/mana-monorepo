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
import { AccountService } from './account.service';
import { CreateAccountDto, UpdateAccountDto } from './dto';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountController {
	constructor(private readonly accountService: AccountService) {}

	@Get()
	findAll(@CurrentUser() user: CurrentUserData) {
		return this.accountService.findAll(user.userId);
	}

	@Get('all')
	findAllIncludingArchived(@CurrentUser() user: CurrentUserData) {
		return this.accountService.findAllIncludingArchived(user.userId);
	}

	@Get('totals')
	getTotals(@CurrentUser() user: CurrentUserData) {
		return this.accountService.getTotals(user.userId);
	}

	@Get(':id')
	findOne(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		return this.accountService.findOne(user.userId, id);
	}

	@Post()
	create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateAccountDto) {
		return this.accountService.create(user.userId, dto);
	}

	@Put('reorder')
	reorder(@CurrentUser() user: CurrentUserData, @Body('accountIds') accountIds: string[]) {
		return this.accountService.reorder(user.userId, accountIds);
	}

	@Put(':id')
	update(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateAccountDto
	) {
		return this.accountService.update(user.userId, id, dto);
	}

	@Post(':id/archive')
	archive(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		return this.accountService.archive(user.userId, id, true);
	}

	@Post(':id/unarchive')
	unarchive(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		return this.accountService.archive(user.userId, id, false);
	}

	@Delete(':id')
	delete(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		return this.accountService.delete(user.userId, id);
	}
}
