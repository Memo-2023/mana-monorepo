import { DynamicModule, Module, Global, Provider } from '@nestjs/common';
import type {
	LlmModuleOptions,
	LlmModuleAsyncOptions,
	LlmOptionsFactory,
} from './interfaces/llm-options.interface';
import { LlmClientService } from './llm-client.service';
import { LLM_MODULE_OPTIONS } from './llm.constants';

@Global()
@Module({})
export class LlmModule {
	static forRoot(options: LlmModuleOptions): DynamicModule {
		return {
			module: LlmModule,
			providers: [
				{
					provide: LLM_MODULE_OPTIONS,
					useValue: options,
				},
				LlmClientService,
			],
			exports: [LLM_MODULE_OPTIONS, LlmClientService],
		};
	}

	static forRootAsync(options: LlmModuleAsyncOptions): DynamicModule {
		const asyncProviders = this.createAsyncProviders(options);

		return {
			module: LlmModule,
			imports: options.imports || [],
			providers: [...asyncProviders, LlmClientService],
			exports: [LLM_MODULE_OPTIONS, LlmClientService],
		};
	}

	private static createAsyncProviders(options: LlmModuleAsyncOptions): Provider[] {
		if (options.useFactory) {
			return [
				{
					provide: LLM_MODULE_OPTIONS,
					useFactory: options.useFactory,
					inject: options.inject || [],
				},
			];
		}

		const useClass = options.useClass;
		const useExisting = options.useExisting;

		if (useClass) {
			return [
				{
					provide: LLM_MODULE_OPTIONS,
					useFactory: async (optionsFactory: LlmOptionsFactory) =>
						await optionsFactory.createLlmOptions(),
					inject: [useClass],
				},
				{
					provide: useClass,
					useClass,
				},
			];
		}

		if (useExisting) {
			return [
				{
					provide: LLM_MODULE_OPTIONS,
					useFactory: async (optionsFactory: LlmOptionsFactory) =>
						await optionsFactory.createLlmOptions(),
					inject: [useExisting],
				},
			];
		}

		return [];
	}
}
