import { Module } from '@nestjs/common';
import { BoardController } from './board.controller';
import { BoardService } from './board.service';
import { UploadModule } from '../upload/upload.module';

@Module({
	imports: [UploadModule],
	controllers: [BoardController],
	providers: [BoardService],
	exports: [BoardService],
})
export class BoardModule {}
