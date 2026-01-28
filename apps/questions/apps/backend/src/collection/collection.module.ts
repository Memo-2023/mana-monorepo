import { Module } from '@nestjs/common';
import { CollectionController } from './collection.controller';
import { CollectionService } from './collection.service';
import { DatabaseModule } from '../db/database.module';

@Module({
	imports: [DatabaseModule],
	controllers: [CollectionController],
	providers: [CollectionService],
	exports: [CollectionService],
})
export class CollectionModule {}
