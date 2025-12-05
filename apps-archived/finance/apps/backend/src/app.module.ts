import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './db/database.module';
import { HealthModule } from './health/health.module';
import { AccountModule } from './account/account.module';
import { CategoryModule } from './category/category.module';
import { TransactionModule } from './transaction/transaction.module';
import { BudgetModule } from './budget/budget.module';
import { TransferModule } from './transfer/transfer.module';
import { ReportModule } from './report/report.module';
import { SettingsModule } from './settings/settings.module';
import { ExchangeRateModule } from './exchange-rate/exchange-rate.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),
		ScheduleModule.forRoot(),
		DatabaseModule,
		HealthModule,
		AccountModule,
		CategoryModule,
		TransactionModule,
		BudgetModule,
		TransferModule,
		ReportModule,
		SettingsModule,
		ExchangeRateModule,
	],
})
export class AppModule {}
