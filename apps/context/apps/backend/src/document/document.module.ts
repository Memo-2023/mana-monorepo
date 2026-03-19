import { Module } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { SpaceModule } from '../space/space.module';

@Module({
	imports: [SpaceModule],
	controllers: [DocumentController],
	providers: [DocumentService],
	exports: [DocumentService],
})
export class DocumentModule {}
