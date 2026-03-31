import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { AiService } from '../ai.service';
import { AI_PRESETS } from '../ai-model.config';
import { getTranscriptText } from '../shared/transcript-utils';
import { UserPromptService } from '../shared/user-prompt.service';

@Injectable()
export class MemoryService {
	private readonly logger = new Logger(MemoryService.name);
	private readonly supabaseUrl: string;
	private readonly supabaseServiceKey: string;

	constructor(
		private aiService: AiService,
		private userPromptService: UserPromptService,
		private configService: ConfigService
	) {
		this.supabaseUrl = this.configService.get<string>('MEMORO_SUPABASE_URL', '');
		this.supabaseServiceKey = this.configService.get<string>('MEMORO_SUPABASE_SERVICE_KEY', '');
	}

	/**
	 * Erstellt eine Memory für ein Memo mit einem spezifischen Prompt.
	 * Repliziert die create-memory Edge Function.
	 */
	async createMemory(
		memoId: string,
		promptId: string
	): Promise<{ memoryId: string; title: string; content: string }> {
		const supabase = createClient(this.supabaseUrl, this.supabaseServiceKey);

		// Memo laden
		const { data: memo, error: memoError } = await supabase
			.from('memos')
			.select('*')
			.eq('id', memoId)
			.single();

		if (memoError || !memo) {
			throw new Error(`Memo not found: ${memoError?.message || 'unknown'}`);
		}

		// Prompt laden
		const { data: prompt, error: promptError } = await supabase
			.from('prompts')
			.select('*')
			.eq('id', promptId)
			.single();

		if (promptError || !prompt) {
			throw new Error(`Prompt not found: ${promptError?.message || 'unknown'}`);
		}

		// Transkript extrahieren
		const transcript = getTranscriptText(memo);
		if (!transcript) {
			throw new Error('No transcript found in memo');
		}

		// Sprache ermitteln
		const primaryLanguage = memo.source?.primary_language || memo.source?.languages?.[0];
		const baseLang = primaryLanguage ? primaryLanguage.split('-')[0].toLowerCase() : 'de';

		// Prompt-Text extrahieren (mehrsprachig)
		let promptText = this.getLocalizedText(prompt.prompt_text, baseLang);
		if (!promptText) {
			throw new Error(`No prompt text found for prompt ${promptId}`);
		}

		// System Pre-Prompt voranstellen (User-spezifisch oder Default)
		const prePrompt = await this.userPromptService.getSystemPromptForMemo(memo.user_id, baseLang);
		if (prePrompt) {
			promptText = `${prePrompt}\n\n${promptText}`;
		}

		// Memory-Titel extrahieren
		const memoryTitle = this.getLocalizedText(prompt.memory_title, baseLang) || 'Memory';

		// Prompt mit Transkript zusammenbauen
		const fullPrompt = promptText.includes('{transcript}')
			? promptText.replace('{transcript}', transcript)
			: `${promptText}\n\nText: ${transcript}`;

		// AI-Antwort generieren
		const answer = await this.aiService.generateText(fullPrompt, AI_PRESETS.memory);

		if (!answer) {
			throw new Error('No response from AI');
		}

		// Sort-Order ermitteln
		const { data: maxSortData } = await supabase
			.from('memories')
			.select('sort_order')
			.eq('memo_id', memoId)
			.order('sort_order', { ascending: false })
			.limit(1)
			.single();

		const nextSortOrder = maxSortData?.sort_order
			? maxSortData.sort_order + 1
			: Math.floor(Math.random() * 5000) + 5000;

		// Memory speichern
		const { data: newMemory, error: insertError } = await supabase
			.from('memories')
			.insert({
				memo_id: memoId,
				title: memoryTitle,
				content: answer,
				media: null,
				sort_order: nextSortOrder,
				metadata: {
					type: 'manual_prompt',
					prompt_id: promptId,
					created_by: 'ai_memory_service',
				},
			})
			.select()
			.single();

		if (insertError) {
			throw new Error(`Failed to create memory: ${insertError.message}`);
		}

		this.logger.log(`Memory created: ${newMemory.id} for memo ${memoId} (prompt: ${promptId})`);
		return { memoryId: newMemory.id, title: memoryTitle, content: answer };
	}

	private getLocalizedText(textObj: any, lang: string): string {
		if (!textObj || typeof textObj !== 'object') return '';
		return (
			textObj[lang] || textObj['de'] || textObj['en'] || (Object.values(textObj)[0] as string) || ''
		);
	}
}
