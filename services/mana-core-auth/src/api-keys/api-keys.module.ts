import { Module } from '@nestjs/common';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';
import { SecurityModule } from '../security';

@Module({
	imports: [SecurityModule],
	controllers: [ApiKeysController],
	providers: [ApiKeysService],
	exports: [ApiKeysService],
})
export class ApiKeysModule {}
