import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { AiService } from '../ai.service';
import { AI_PRESETS } from '../ai-model.config';
import { UserPromptService } from '../shared/user-prompt.service';

@Injectable()
export class QuestionService {
	private readonly logger = new Logger(QuestionService.name);
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
	 * Beantwortet eine Frage zu einem Memo und speichert die Antwort als Memory.
	 * Repliziert die question-memo Edge Function.
	 */
	async askQuestion(
		memoId: string,
		question: string
	): Promise<{ memoryId: string; question: string; answer: string }> {
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

		// Kontext-Informationen extrahieren
		const contextInfo = this.extractContextInfo(memo.source, memo.metadata);
		if (!contextInfo.transcript) {
			throw new Error('No transcript found in memo');
		}

		// Sprache ermitteln
		const primaryLanguage = memo.source?.primary_language || memo.source?.languages?.[0];
		const baseLang = primaryLanguage ? primaryLanguage.split('-')[0].toLowerCase() : 'de';

		// System-Prompt laden (User-spezifisch oder Default)
		const prePrompt = await this.userPromptService.getSystemPromptForMemo(memo.user_id, baseLang);

		// Prompt zusammenbauen
		const prompt = this.buildQuestionPrompt(question, contextInfo, prePrompt);

		// AI-Antwort generieren
		const answer = await this.aiService.generateText(prompt, AI_PRESETS.memory);

		if (!answer) {
			throw new Error('No response from AI');
		}

		// Sort-Order ermitteln (Q&A range: 200-299)
		const { data: maxSortData } = await supabase
			.from('memories')
			.select('sort_order')
			.eq('memo_id', memoId)
			.order('sort_order', { ascending: false })
			.limit(1)
			.single();

		const nextSortOrder = maxSortData?.sort_order ? maxSortData.sort_order + 1 : 200;

		// Memory speichern
		const { data: newMemory, error: insertError } = await supabase
			.from('memories')
			.insert({
				memo_id: memoId,
				title: question,
				content: answer,
				media: null,
				sort_order: nextSortOrder,
				metadata: {
					type: 'question',
					question,
					created_by: 'ai_question_service',
				},
			})
			.select()
			.single();

		if (insertError) {
			throw new Error(`Failed to create memory: ${insertError.message}`);
		}

		this.logger.log(`Question answered for memo ${memoId}: "${question.substring(0, 50)}..."`);
		return { memoryId: newMemory.id, question, answer };
	}

	private buildQuestionPrompt(question: string, contextInfo: any, prePrompt: string): string {
		const contextParts: string[] = [];

		if (contextInfo.locationName) {
			contextParts.push(`Aufnahmeort: ${contextInfo.locationName}`);
		} else if (contextInfo.locationAddress) {
			contextParts.push(`Aufnahmeort: ${contextInfo.locationAddress}`);
		}

		const statsInfo: string[] = [];
		if (contextInfo.hasMultipleSpeakers) {
			statsInfo.push(`${contextInfo.speakerCount} Sprecher`);
		}
		statsInfo.push(`${Math.round(contextInfo.duration)}s Dauer`);
		if (contextInfo.wordCount) {
			statsInfo.push(`${contextInfo.wordCount} Wörter`);
		}
		contextParts.push(`Audio-Info: ${statsInfo.join(', ')}`);

		const contextFooter =
			contextParts.length > 0
				? `\n\nZusätzliche Kontext-Informationen:\n${contextParts.join('\n')}`
				: '';

		const userPrompt = `Frage: ${question}\n\nTranskript:\n${contextInfo.transcript}${contextFooter}\n\n${contextInfo.hasMultipleSpeakers ? 'Du kannst bei Bedarf auf spezifische Sprecher verweisen.' : ''}`;

		return prePrompt ? `${prePrompt}\n\n${userPrompt}` : userPrompt;
	}

	private extractContextInfo(source: any, metadata: any = {}): any {
		const transcript = this.formatTranscriptWithSpeakers(source);

		let speakerCount = 0;
		let totalDuration = 0;
		const language = source?.primary_language || source?.languages?.[0] || 'unbekannt';

		if (source?.type === 'combined' && source?.additional_recordings) {
			const allSpeakers = new Set<string>();
			for (const rec of source.additional_recordings) {
				if (rec.speakers) {
					Object.keys(rec.speakers).forEach((id) => allSpeakers.add(id));
				}
				if (rec.duration) totalDuration += rec.duration;
			}
			speakerCount = allSpeakers.size;
			totalDuration = source.duration || totalDuration;
		} else {
			speakerCount = source?.speakers ? Object.keys(source.speakers).length : 0;
			totalDuration = source?.duration || 0;
		}

		return {
			transcript,
			duration: metadata?.stats?.audioDuration || totalDuration,
			speakerCount,
			wordCount: metadata?.stats?.wordCount || null,
			language,
			locationName: metadata?.location?.address?.name || null,
			locationAddress: metadata?.location?.address?.formattedAddress || null,
			hasMultipleSpeakers: speakerCount > 1,
			hasLocation: !!(
				metadata?.location?.address?.name || metadata?.location?.address?.formattedAddress
			),
		};
	}

	private formatTranscriptWithSpeakers(source: any): string {
		if (source?.type === 'combined' && source?.additional_recordings?.length > 0) {
			const transcripts = source.additional_recordings
				.map((rec: any) => {
					if (rec.utterances?.length > 0) {
						return rec.speakers
							? rec.utterances
									.map((u: any) => `${rec.speakers[u.speakerId] || u.speakerId}: ${u.text}`)
									.join('\n')
							: rec.utterances.map((u: any) => u.text).join(' ');
					}
					return rec.transcript || rec.content || rec.transcription || '';
				})
				.filter(Boolean);
			if (transcripts.length > 0) return transcripts.join('\n\n--- Nächstes Memo ---\n\n');
		}

		if (source?.utterances?.length > 0 && source?.speakers) {
			return source.utterances
				.map((u: any) => `${source.speakers[u.speakerId] || u.speakerId}: ${u.text}`)
				.join('\n');
		}

		return source?.transcript || source?.content || source?.transcription || '';
	}
}
