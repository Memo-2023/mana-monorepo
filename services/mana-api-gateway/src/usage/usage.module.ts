import { Module, forwardRef } from '@nestjs/common';
import { UsageService } from './usage.service';
import { ApiKeysModule } from '../api-keys/api-keys.module';

@Module({
	imports: [forwardRef(() => ApiKeysModule)],
	providers: [UsageService],
	exports: [UsageService],
})
export class UsageModule {}
