import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { PictureModule } from '../picture/picture.module';
import { SessionModule } from '../session/session.module';

@Module({
	imports: [PictureModule, SessionModule],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
