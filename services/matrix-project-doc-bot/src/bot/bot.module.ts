import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { ProjectModule } from '../project/project.module';
import { MediaModule } from '../media/media.module';
import { GenerationModule } from '../generation/generation.module';
import { SessionModule, CreditModule } from '@manacore/bot-services';

@Module({
	imports: [ProjectModule, MediaModule, GenerationModule, SessionModule.forRoot(), CreditModule.forRoot()],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
