import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { TemplatesModule } from '../templates/templates.module';
import { QueueModule } from '../queue/queue.module';
import { DevicesModule } from '../devices/devices.module';
import { PreferencesModule } from '../preferences/preferences.module';

@Module({
	imports: [TemplatesModule, QueueModule, DevicesModule, PreferencesModule],
	providers: [NotificationsService],
	controllers: [NotificationsController],
	exports: [NotificationsService],
})
export class NotificationsModule {}
