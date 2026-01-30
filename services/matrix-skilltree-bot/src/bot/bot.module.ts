import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { SkilltreeModule } from '../skilltree/skilltree.module';
import { SessionModule } from '../session/session.module';

@Module({
	imports: [SkilltreeModule, SessionModule],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
