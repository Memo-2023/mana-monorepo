import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MatrixService } from './matrix.service';
import { TodoModule } from '../todo/todo.module';
import {
	TranscriptionModule,
	SessionModule,
	CreditModule,
	TodoApiService,
} from '@manacore/bot-services';

// Factory provider for TodoApiService
const todoApiServiceProvider = {
	provide: TodoApiService,
	useFactory: (configService: ConfigService) => {
		const baseUrl = configService.get<string>('TODO_BACKEND_URL', 'http://localhost:3018');
		return new TodoApiService(baseUrl);
	},
	inject: [ConfigService],
};

@Module({
	imports: [
		ConfigModule,
		TodoModule,
		TranscriptionModule.forRoot(),
		SessionModule.forRoot({ storageMode: 'redis' }),
		CreditModule.forRoot(),
	],
	providers: [MatrixService, todoApiServiceProvider],
	exports: [MatrixService],
})
export class BotModule {}
