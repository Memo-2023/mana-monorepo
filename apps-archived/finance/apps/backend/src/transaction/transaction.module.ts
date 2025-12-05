import { Module } from '@nestjs/common';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { AccountModule } from '../account/account.module';

@Module({
	imports: [AccountModule],
	controllers: [TransactionController],
	providers: [TransactionService],
	exports: [TransactionService],
})
export class TransactionModule {}
