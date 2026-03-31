import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsClientService } from './settings-client.service';
import { AuthModule } from '../auth/auth.module';

@Module({
	imports: [AuthModule],
	controllers: [SettingsController],
	providers: [SettingsClientService],
	exports: [SettingsClientService],
})
export class SettingsModule {}
