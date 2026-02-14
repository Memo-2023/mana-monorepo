import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { SttModule } from '../stt/stt.module';

@Module({
	imports: [SttModule],
	providers: [MatrixService],
})
export class BotModule {}
