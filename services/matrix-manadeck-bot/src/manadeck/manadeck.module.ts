import { Module } from '@nestjs/common';
import { ManadeckService } from './manadeck.service';

@Module({
	providers: [ManadeckService],
	exports: [ManadeckService],
})
export class ManadeckModule {}
