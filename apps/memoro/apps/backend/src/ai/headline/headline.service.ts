import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { AiService } from '../ai.service';
import { AI_PRESETS } from '../ai-model.config';
import { SYSTEM_PROMPTS } from './headline.prompts';

@Injectable()
export class HeadlineService {
	private readonly logger = new Logger(HeadlineService.name);
	private readonly supabaseUrl: string;
	private readonly supabaseServiceKey: string;

	constructor(
		private aiService: AiService,
		private configService: ConfigService
	) {
		this.supabaseUrl = this.configService.get<string>('MEMORO_SUPABASE_URL', '');
		this.supabaseServiceKey = this.configService.get<string>('MEMORO_SUPABASE_SERVICE_KEY', '');
	}

	/**
	 * Generiert Headline + Intro aus einem Transkript.
	 */
	async generateHeadlineAndIntro(
		transcript: string,
		language = 'de'
	): Promise<{ headline: string; intro: string }> {
		const prompt = this.buildPrompt(transcript, language);

		try {
			const content = await this.aiService.generateText(prompt, AI_PRESETS.headline);

			const result = this.parseResponse(content);
			this.logger.debug(`Headline generated: "${result.headline}" (lang=${language})`);
			return result;
		} catch (error) {
			this.logger.error(
				`Headline generation failed: ${error instanceof Error ? error.message : error}`
			);
			return { headline: 'Neue Aufnahme', intro: 'Keine Zusammenfassung verfügbar.' };
		}
	}

	/**
	 * Vollständige Pipeline: Memo laden → Headline generieren → Memo updaten → Broadcast senden.
	 */
	async processHeadlineForMemo(memoId: string): Promise<{ headline: string; intro: string }> {
		const supabase = createClient(this.supabaseUrl, this.supabaseServiceKey);

		// Set processing status
		await this.setProcessingStatus(supabase, memoId, 'processing');

		try {
			// Memo laden
			const { data: memo, error: memoError } = await supabase
				.from('memos')
				.select('*')
				.eq('id', memoId)
				.single();

			if (memoError || !memo) {
				throw new Error(`Memo not found: ${memoError?.message || 'unknown'}`);
			}

			// Transkript extrahieren
			const transcript = this.extractTranscript(memo);
			if (!transcript) {
				await this.setErrorStatus(supabase, memoId, 'Kein Transkript im Memo gefunden');
				throw new Error('No transcript found in memo');
			}

			// Sprache ermitteln
			const language = this.detectLanguage(memo);

			// Headline generieren
			const { headline, intro } = await this.generateHeadlineAndIntro(transcript, language);

			// Memo updaten
			const { error: updateError } = await supabase
				.from('memos')
				.update({
					title: headline,
					intro,
					updated_at: new Date().toISOString(),
				})
				.eq('id', memoId);

			if (updateError) {
				throw new Error(`Memo update failed: ${updateError.message}`);
			}

			// Broadcast senden (fire & forget)
			this.sendBroadcast(supabase, memoId, headline, intro).catch((err) =>
				this.logger.warn(`Broadcast failed for memo ${memoId}: ${err}`)
			);

			// Status auf completed setzen
			await this.setCompletedStatus(supabase, memoId, { headline, intro, language });

			this.logger.log(`Headline processed for memo ${memoId}: "${headline}"`);
			return { headline, intro };
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			await this.setErrorStatus(supabase, memoId, msg);
			throw error;
		}
	}

	// ── Private Helpers ──

	private buildPrompt(transcript: string, language: string): string {
		const baseLanguage = language.split('-')[0].toLowerCase();
		const systemPrompt =
			SYSTEM_PROMPTS.headline[baseLanguage] ||
			SYSTEM_PROMPTS.headline['de'] ||
			SYSTEM_PROMPTS.headline['en'];
		return `${systemPrompt}\n\n${transcript}`;
	}

	private parseResponse(content: string): { headline: string; intro: string } {
		const headlineMatch = content.match(/HEADLINE:\s*(.+?)(?=\nINTRO:|$)/s);
		const introMatch = content.match(/INTRO:\s*(.+?)$/s);
		return {
			headline: headlineMatch?.[1]?.trim() || 'Neue Aufnahme',
			intro: introMatch?.[1]?.trim() || 'Keine Zusammenfassung verfügbar.',
		};
	}

	private extractTranscript(memo: any): string {
		// Utterances (bevorzugt)
		if (memo.source?.utterances?.length > 0) {
			return [...memo.source.utterances]
				.sort((a: any, b: any) => (a.offset || 0) - (b.offset || 0))
				.map((u: any) => u.text)
				.filter(Boolean)
				.join(' ');
		}

		// Direkte Transkript-Felder
		if (memo.transcript) return memo.transcript;
		if (memo.source?.transcript) return memo.source.transcript;
		if (memo.source?.content) return memo.source.content;

		// Kombinierte Aufnahmen
		if (memo.source?.type === 'combined' && memo.source?.additional_recordings) {
			return memo.source.additional_recordings
				.map((rec: any) => {
					if (rec.utterances?.length > 0) {
						return [...rec.utterances]
							.sort((a: any, b: any) => (a.offset || 0) - (b.offset || 0))
							.map((u: any) => u.text)
							.filter(Boolean)
							.join(' ');
					}
					return rec.transcript || '';
				})
				.filter(Boolean)
				.join('\n\n');
		}

		return '';
	}

	private detectLanguage(memo: any): string {
		if (memo.source?.primary_language) return memo.source.primary_language;
		if (memo.source?.languages?.[0]) return memo.source.languages[0];
		if (memo.metadata?.primary_language) return memo.metadata.primary_language;
		return 'de';
	}

	private async setProcessingStatus(supabase: any, memoId: string, status: string): Promise<void> {
		try {
			await supabase.rpc('set_memo_process_status', {
				p_memo_id: memoId,
				p_process_name: 'headline_and_intro',
				p_status: status,
				p_timestamp: new Date().toISOString(),
			});
		} catch (err) {
			this.logger.error(`Failed to set processing status for ${memoId}: ${err}`);
		}
	}

	private async setCompletedStatus(supabase: any, memoId: string, details: any): Promise<void> {
		try {
			await supabase.rpc('set_memo_process_status_with_details', {
				p_memo_id: memoId,
				p_process_name: 'headline_and_intro',
				p_status: 'completed',
				p_timestamp: new Date().toISOString(),
				p_details: details,
			});
		} catch (err) {
			this.logger.error(`Failed to set completed status for ${memoId}: ${err}`);
		}
	}

	private async setErrorStatus(supabase: any, memoId: string, errorMsg: string): Promise<void> {
		try {
			await supabase.rpc('set_memo_process_error', {
				p_memo_id: memoId,
				p_process_name: 'headline_and_intro',
				p_timestamp: new Date().toISOString(),
				p_reason: errorMsg,
				p_details: null,
			});
		} catch (err) {
			this.logger.error(`Failed to set error status for ${memoId}: ${err}`);
		}
	}

	private async sendBroadcast(
		supabase: any,
		memoId: string,
		headline: string,
		intro: string
	): Promise<void> {
		const channel = supabase.channel(`memo-updates-${memoId}`);
		await new Promise<void>((resolve) => {
			channel.subscribe(async (status: string) => {
				if (status === 'SUBSCRIBED') {
					await channel.send({
						type: 'broadcast',
						event: 'memo-updated',
						payload: {
							type: 'memo-updated',
							memoId,
							changes: { title: headline, intro, updated_at: new Date().toISOString() },
							source: 'headline-ai-service',
						},
					});
					supabase.removeChannel(channel);
					resolve();
				}
			});
		});
	}
}
