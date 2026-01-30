import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { ManadeckModule } from '../manadeck/manadeck.module';
import { SessionModule } from '../session/session.module';

@Module({
	imports: [ManadeckModule, SessionModule],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
