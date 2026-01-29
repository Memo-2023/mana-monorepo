import { Module, forwardRef } from '@nestjs/common';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';
import { UsageModule } from '../usage/usage.module';

@Module({
	imports: [forwardRef(() => UsageModule)],
	controllers: [ApiKeysController],
	providers: [ApiKeysService],
	exports: [ApiKeysService],
})
export class ApiKeysModule {}
