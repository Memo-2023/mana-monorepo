import { Module } from '@nestjs/common';
import { TransferController } from './transfer.controller';
import { TransferService } from './transfer.service';
import { AccountModule } from '../account/account.module';

@Module({
	imports: [AccountModule],
	controllers: [TransferController],
	providers: [TransferService],
	exports: [TransferService],
})
export class TransferModule {}
