import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsClientService } from './settings-client.service';
import { CoreModule } from '../core/core.module';

@Module({
	imports: [CoreModule],
	controllers: [SettingsController],
	providers: [SettingsClientService],
	exports: [SettingsClientService],
})
export class SettingsModule {}
