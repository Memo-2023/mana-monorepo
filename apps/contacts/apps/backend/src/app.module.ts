import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './db/database.module';
import { ContactModule } from './contact/contact.module';
import { GroupModule } from './group/group.module';
import { TagModule } from './tag/tag.module';
import { NoteModule } from './note/note.module';
import { ActivityModule } from './activity/activity.module';
import { HealthModule } from './health/health.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),
		DatabaseModule,
		ContactModule,
		GroupModule,
		TagModule,
		NoteModule,
		ActivityModule,
		HealthModule,
	],
})
export class AppModule {}
