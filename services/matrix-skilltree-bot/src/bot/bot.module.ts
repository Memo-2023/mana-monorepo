import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { SkilltreeModule } from '../skilltree/skilltree.module';
import { SessionModule } from '@manacore/bot-services';

@Module({
	imports: [SkilltreeModule, SessionModule.forRoot()],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
