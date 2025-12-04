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
	ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, type CurrentUserData } from '@manacore/shared-nestjs-auth';
import { BudgetService } from './budget.service';
import { CreateBudgetDto, UpdateBudgetDto } from './dto';

@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetController {
	constructor(private readonly budgetService: BudgetService) {}

	@Get()
	findAll(@CurrentUser() user: CurrentUserData) {
		return this.budgetService.findAll(user.userId);
	}

	@Get('month/:year/:month')
	findByMonth(
		@CurrentUser() user: CurrentUserData,
		@Param('year', ParseIntPipe) year: number,
		@Param('month', ParseIntPipe) month: number
	) {
		return this.budgetService.findByMonth(user.userId, year, month);
	}

	@Get(':id')
	findOne(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		return this.budgetService.findOne(user.userId, id);
	}

	@Post()
	create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateBudgetDto) {
		return this.budgetService.create(user.userId, dto);
	}

	@Post('copy')
	copyFromPreviousMonth(
		@CurrentUser() user: CurrentUserData,
		@Body('year') year: number,
		@Body('month') month: number
	) {
		return this.budgetService.copyFromPreviousMonth(user.userId, year, month);
	}

	@Put(':id')
	update(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateBudgetDto
	) {
		return this.budgetService.update(user.userId, id, dto);
	}

	@Delete(':id')
	delete(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		return this.budgetService.delete(user.userId, id);
	}
}
