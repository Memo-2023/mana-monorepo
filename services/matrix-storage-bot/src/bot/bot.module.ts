import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { StorageModule } from '../storage/storage.module';
import { SessionModule } from '@manacore/bot-services';

@Module({
	imports: [StorageModule, SessionModule.forRoot()],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
