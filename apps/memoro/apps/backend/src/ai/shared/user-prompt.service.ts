import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { ROOT_SYSTEM_PROMPTS } from './system-prompts';

@Injectable()
export class UserPromptService {
	private readonly logger = new Logger(UserPromptService.name);
	private readonly supabaseUrl: string;
	private readonly supabaseServiceKey: string;

	constructor(private configService: ConfigService) {
		this.supabaseUrl = this.configService.get<string>('MEMORO_SUPABASE_URL', '');
		this.supabaseServiceKey = this.configService.get<string>('MEMORO_SUPABASE_SERVICE_KEY', '');
	}

	/**
	 * Gibt den System-Prompt für einen User zurück.
	 * Wenn der User einen eigenen definiert hat, wird dieser verwendet.
	 * Sonst der Standard-PRE_PROMPT in der jeweiligen Sprache.
	 */
	async getSystemPrompt(userId: string, language = 'de'): Promise<string> {
		try {
			const supabase = createClient(this.supabaseUrl, this.supabaseServiceKey);
			const { data: user, error } = await supabase
				.from('users')
				.select('app_settings')
				.eq('id', userId)
				.single();

			if (!error && user?.app_settings?.memoro?.systemPrompt) {
				this.logger.debug(`Using custom system prompt for user ${userId}`);
				return user.app_settings.memoro.systemPrompt;
			}
		} catch (err) {
			this.logger.warn(`Failed to load user system prompt, using default: ${err}`);
		}

		const baseLang = language.split('-')[0].toLowerCase();
		return ROOT_SYSTEM_PROMPTS.PRE_PROMPT[baseLang] || ROOT_SYSTEM_PROMPTS.PRE_PROMPT['de'];
	}

	/**
	 * Gibt den System-Prompt für den Owner eines Memos zurück.
	 */
	async getSystemPromptForMemo(memoUserId: string, language = 'de'): Promise<string> {
		return this.getSystemPrompt(memoUserId, language);
	}
}
