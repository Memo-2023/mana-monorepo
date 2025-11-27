import { Module } from '@nestjs/common';
import { BoardItemController } from './board-item.controller';
import { BoardItemService } from './board-item.service';

@Module({
	controllers: [BoardItemController],
	providers: [BoardItemService],
	exports: [BoardItemService],
})
export class BoardItemModule {}
