export { openaiProvider } from './openai';
export { anthropicProvider } from './anthropic';
export { geminiProvider } from './gemini';
export { mistralProvider } from './mistral';
export type { ByokProvider, ByokProviderId, ByokCallOptions } from './types';

import { openaiProvider } from './openai';
import { anthropicProvider } from './anthropic';
import { geminiProvider } from './gemini';
import { mistralProvider } from './mistral';
import type { ByokProvider } from './types';

/** All built-in BYOK providers. Apps can still add custom ones. */
export const BUILTIN_BYOK_PROVIDERS: readonly ByokProvider[] = [
	openaiProvider,
	anthropicProvider,
	geminiProvider,
	mistralProvider,
];
