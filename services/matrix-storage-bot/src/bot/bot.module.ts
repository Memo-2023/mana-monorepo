import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { StorageModule } from '../storage/storage.module';
import { SessionModule } from '../session/session.module';

@Module({
	imports: [StorageModule, SessionModule],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
