import { Module } from '@nestjs/common';
import { UmamiService } from './umami.service';

@Module({
	providers: [UmamiService],
	exports: [UmamiService],
})
export class UmamiModule {}
