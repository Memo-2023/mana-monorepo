import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';

@Module({
	imports: [
		MulterModule.register({
			limits: { fileSize: 20 * 1024 * 1024 },
		}),
	],
	controllers: [DocumentController],
	providers: [DocumentService],
	exports: [DocumentService],
})
export class DocumentModule {}
