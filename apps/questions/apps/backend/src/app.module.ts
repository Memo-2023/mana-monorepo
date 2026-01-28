import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './db/database.module';
import { HealthModule } from './health/health.module';
import { QuestionModule } from './question/question.module';
import { CollectionModule } from './collection/collection.module';
import { ResearchModule } from './research/research.module';
import { AnswerModule } from './answer/answer.module';
import { SourceModule } from './source/source.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configuration],
		}),
		DatabaseModule,
		HealthModule,
		QuestionModule,
		CollectionModule,
		ResearchModule,
		AnswerModule,
		SourceModule,
	],
})
export class AppModule {}
