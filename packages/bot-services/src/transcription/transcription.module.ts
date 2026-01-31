import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TranscriptionService } from './transcription.service';
import { TranscriptionModuleOptions, STT_MODULE_OPTIONS } from './types';

/**
 * Shared Speech-to-Text transcription module
 *
 * Provides TranscriptionService for voice command processing in Matrix bots.
 *
 * @example
 * ```typescript
 * // With explicit configuration
 * @Module({
 *   imports: [
 *     TranscriptionModule.register({
 *       sttUrl: 'http://mana-stt:3020',
 *       defaultLanguage: 'de'
 *     })
 *   ]
 * })
 *
 * // With ConfigService (reads from stt.url or STT_URL)
 * @Module({
 *   imports: [TranscriptionModule.forRoot()]
 * })
 * ```
 */
@Global()
@Module({})
export class TranscriptionModule {
	/**
	 * Register module with explicit options
	 */
	static register(options: TranscriptionModuleOptions = {}): DynamicModule {
		return {
			module: TranscriptionModule,
			imports: [ConfigModule],
			providers: [
				{
					provide: STT_MODULE_OPTIONS,
					useValue: options,
				},
				TranscriptionService,
			],
			exports: [TranscriptionService],
		};
	}

	/**
	 * Register module with ConfigService (reads stt.url or STT_URL from config)
	 */
	static forRoot(): DynamicModule {
		return {
			module: TranscriptionModule,
			imports: [ConfigModule],
			providers: [TranscriptionService],
			exports: [TranscriptionService],
		};
	}
}
