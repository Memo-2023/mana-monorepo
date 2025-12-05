import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './db/database.module';
import { HealthModule } from './health/health.module';
import { VotesModule } from './votes/votes.module';
import { CommentsModule } from './comments/comments.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),
		DatabaseModule,
		HealthModule,
		VotesModule,
		CommentsModule,
	],
})
export class AppModule {}
