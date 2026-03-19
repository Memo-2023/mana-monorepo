import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { TokenModule } from '../token/token.module';

@Module({
	imports: [TokenModule],
	controllers: [AiController],
	providers: [AiService],
	exports: [AiService],
})
export class AiModule {}
