import {
	Controller,
	Get,
	Post,
	Put,
	Delete,
	Body,
	Param,
	Query,
	UseGuards,
	ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, type CurrentUserData } from '@manacore/shared-nestjs-auth';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto, UpdateTransactionDto, QueryTransactionDto } from './dto';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionController {
	constructor(private readonly transactionService: TransactionService) {}

	@Get()
	findAll(@CurrentUser() user: CurrentUserData, @Query() query: QueryTransactionDto) {
		return this.transactionService.findAll(user.userId, query);
	}

	@Get('recent')
	findRecent(@CurrentUser() user: CurrentUserData, @Query('limit') limit?: number) {
		return this.transactionService.findRecent(user.userId, limit);
	}

	@Get('summary')
	getSummary(
		@CurrentUser() user: CurrentUserData,
		@Query('startDate') startDate: string,
		@Query('endDate') endDate: string
	) {
		return this.transactionService.getSummary(user.userId, startDate, endDate);
	}

	@Get(':id')
	findOne(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		return this.transactionService.findOne(user.userId, id);
	}

	@Post()
	create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateTransactionDto) {
		return this.transactionService.create(user.userId, dto);
	}

	@Put(':id')
	update(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateTransactionDto
	) {
		return this.transactionService.update(user.userId, id, dto);
	}

	@Delete(':id')
	delete(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		return this.transactionService.delete(user.userId, id);
	}
}
