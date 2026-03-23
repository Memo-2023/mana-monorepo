import { Inject, Injectable } from '@nestjs/common';
import { LlmClient } from './llm-client';
import { LLM_MODULE_OPTIONS } from './llm.constants';
import type { LlmModuleOptions } from './interfaces/llm-options.interface';
import { resolveOptions } from './interfaces/llm-options.interface';

/**
 * NestJS injectable wrapper around LlmClient.
 * All logic lives in the framework-agnostic LlmClient base class.
 */
@Injectable()
export class LlmClientService extends LlmClient {
	constructor(@Inject(LLM_MODULE_OPTIONS) options: LlmModuleOptions) {
		super(resolveOptions(options));
	}
}
