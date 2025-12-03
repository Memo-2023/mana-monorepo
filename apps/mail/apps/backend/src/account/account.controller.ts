import {
	Controller,
	Get,
	Post,
	Patch,
	Delete,
	Body,
	Param,
	Query,
	UseGuards,
	ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { AccountService } from './account.service';
import { CreateImapAccountDto, UpdateAccountDto, AccountQueryDto } from './dto/account.dto';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountController {
	constructor(private readonly accountService: AccountService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData, @Query() query: AccountQueryDto) {
		const accounts = await this.accountService.findByUserId(user.userId, query);
		const total = await this.accountService.count(user.userId);

		// Remove sensitive fields from response
		const safeAccounts = accounts.map((account) => ({
			...account,
			encryptedPassword: undefined,
			accessToken: undefined,
			refreshToken: undefined,
		}));

		return { accounts: safeAccounts, total };
	}

	@Get(':id')
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		const account = await this.accountService.findById(id, user.userId);
		if (!account) {
			return { account: null };
		}

		// Remove sensitive fields
		const safeAccount = {
			...account,
			encryptedPassword: undefined,
			accessToken: undefined,
			refreshToken: undefined,
		};

		return { account: safeAccount };
	}

	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateImapAccountDto) {
		const account = await this.accountService.create({
			...dto,
			userId: user.userId,
			provider: 'imap',
		});

		// Remove sensitive fields
		const safeAccount = {
			...account,
			encryptedPassword: undefined,
		};

		return { account: safeAccount };
	}

	@Patch(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateAccountDto
	) {
		const account = await this.accountService.update(id, user.userId, dto);

		// Remove sensitive fields
		const safeAccount = {
			...account,
			encryptedPassword: undefined,
			accessToken: undefined,
			refreshToken: undefined,
		};

		return { account: safeAccount };
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		await this.accountService.delete(id, user.userId);
		return { success: true };
	}

	@Post(':id/default')
	async setDefault(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		const account = await this.accountService.setDefault(id, user.userId);

		// Remove sensitive fields
		const safeAccount = {
			...account,
			encryptedPassword: undefined,
			accessToken: undefined,
			refreshToken: undefined,
		};

		return { account: safeAccount };
	}

	@Post(':id/sync')
	async triggerSync(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		// TODO: Trigger sync via SyncService
		// For now, just return success
		return { success: true, message: 'Sync triggered' };
	}

	@Post(':id/test')
	async testConnection(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string
	) {
		// TODO: Test IMAP/SMTP connection
		// For now, just return success
		return { success: true, message: 'Connection test not yet implemented' };
	}
}
