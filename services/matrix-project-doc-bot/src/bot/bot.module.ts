import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { ProjectModule } from '../project/project.module';
import { MediaModule } from '../media/media.module';
import { GenerationModule } from '../generation/generation.module';

@Module({
	imports: [ProjectModule, MediaModule, GenerationModule],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
