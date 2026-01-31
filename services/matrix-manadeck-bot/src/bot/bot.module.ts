import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { ManadeckModule } from '../manadeck/manadeck.module';
import { SessionModule } from '@manacore/bot-services';

@Module({
	imports: [ManadeckModule, SessionModule.forRoot()],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
