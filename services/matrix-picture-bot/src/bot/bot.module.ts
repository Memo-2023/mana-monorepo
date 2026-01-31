import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { PictureModule } from '../picture/picture.module';
import { SessionModule } from '@manacore/bot-services';

@Module({
	imports: [PictureModule, SessionModule.forRoot()],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
