import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Module({
	controllers: [SettingsController],
	providers: [SettingsService, JwtAuthGuard],
	exports: [SettingsService],
})
export class SettingsModule {}
