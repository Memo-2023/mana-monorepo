import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { OllamaModule } from '../ollama/ollama.module';

@Module({
	imports: [OllamaModule],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
