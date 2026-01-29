import { Module } from '@nestjs/common';
import { RobotsService } from './robots.service';
import { CacheModule } from '../cache/cache.module';

@Module({
	imports: [CacheModule],
	providers: [RobotsService],
	exports: [RobotsService],
})
export class RobotsModule {}
