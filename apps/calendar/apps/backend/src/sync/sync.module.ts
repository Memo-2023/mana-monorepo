import { Module } from '@nestjs/common';
import { DatabaseModule } from '../db/database.module';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { ICalService } from './ical.service';
import { CalDavService } from './caldav.service';
import { GoogleCalendarService } from './google-calendar.service';
import { EncryptionService } from '../common/encryption.service';

@Module({
	imports: [DatabaseModule],
	controllers: [SyncController],
	providers: [SyncService, ICalService, CalDavService, GoogleCalendarService, EncryptionService],
	exports: [SyncService, ICalService],
})
export class SyncModule {}
