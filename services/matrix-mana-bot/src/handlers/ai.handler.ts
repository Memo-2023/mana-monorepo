import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '@manacore/bot-services';
import { CommandContext } from '../bot/command-router.service';

@Injectable()
export class AiHandler {
	private readonly logger = new Logger(AiHandler.name);

	constructor(private aiService: AiService) {}

	async chat(ctx: CommandContext, message: string): Promise<string> {
		this.logger.debug(`Chat request from ${ctx.userId}: ${message.substring(0, 50)}...`);

		const response = await this.aiService.chatSimple(ctx.userId, message);
		return response;
	}

	async listModels(ctx: CommandContext): Promise<string> {
		const models = await this.aiService.listModels();

		if (models.length === 0) {
			return '❌ Keine Modelle gefunden. Ist Ollama gestartet?';
		}

		const session = this.aiService.getSession(ctx.userId);
		const currentModel = session?.model || this.aiService.getDefaultModel();

		const modelList = models
			.map((m) => {
				const sizeMB = (m.size / 1024 / 1024).toFixed(0);
				const active = m.name === currentModel ? ' ✓' : '';
				return `• \`${m.name}\` (${sizeMB} MB)${active}`;
			})
			.join('\n');

		return `**Verfügbare Modelle:**\n\n${modelList}\n\nWechseln mit: \`!model [name]\``;
	}

	async setModel(ctx: CommandContext, modelName: string): Promise<string> {
		if (!modelName.trim()) {
			const session = this.aiService.getSession(ctx.userId);
			const currentModel = session?.model || this.aiService.getDefaultModel();
			return `Aktuelles Modell: \`${currentModel}\`\n\nVerwendung: \`!model gemma3:4b\``;
		}

		const models = await this.aiService.listModels();
		const exists = models.some((m) => m.name === modelName);

		if (!exists) {
			const available = models.map((m) => m.name).join(', ');
			return `❌ Modell "${modelName}" nicht gefunden.\n\nVerfügbar: ${available}`;
		}

		this.aiService.setSessionModel(ctx.userId, modelName);
		this.logger.log(`User ${ctx.userId} switched to model ${modelName}`);

		return `✅ Modell gewechselt zu: \`${modelName}\``;
	}

	async compareAll(ctx: CommandContext, question: string): Promise<string> {
		if (!question.trim()) {
			return `**Verwendung:** \`!all [Deine Frage]\`\n\nBeispiel: \`!all Was ist 2+2?\``;
		}

		const results = await this.aiService.compareModels(question);

		if (results.length === 0) {
			return '❌ Keine Modelle gefunden. Ist Ollama gestartet?';
		}

		let resultText = `**📊 Modellvergleich**\n\n**Frage:** "${question}"\n\n---\n\n`;

		for (const result of results) {
			const durationSec = (result.duration / 1000).toFixed(1);
			if (result.error) {
				resultText += `**${result.model}** ⏱️ ${durationSec}s\n❌ Fehler: ${result.error}\n\n---\n\n`;
			} else {
				const truncated =
					result.response.length > 400
						? result.response.substring(0, 400) + '...'
						: result.response;
				resultText += `**${result.model}** ⏱️ ${durationSec}s\n${truncated}\n\n---\n\n`;
			}
		}

		return resultText;
	}

	async clearHistory(ctx: CommandContext): Promise<string> {
		this.aiService.clearSessionHistory(ctx.userId);
		this.logger.log(`User ${ctx.userId} cleared chat history`);
		return '✅ Chat-Verlauf gelöscht.';
	}
}
