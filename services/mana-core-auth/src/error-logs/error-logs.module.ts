import { Module } from '@nestjs/common';
import { ErrorLogsController } from './error-logs.controller';
import { ErrorLogsService } from './error-logs.service';
import { OptionalAuthGuard } from '../common/guards/optional-auth.guard';

@Module({
	controllers: [ErrorLogsController],
	providers: [ErrorLogsService, OptionalAuthGuard],
	exports: [ErrorLogsService],
})
export class ErrorLogsModule {}
