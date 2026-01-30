import { Module } from '@nestjs/common';
import { SkilltreeService } from './skilltree.service';

@Module({
	providers: [SkilltreeService],
	exports: [SkilltreeService],
})
export class SkilltreeModule {}
