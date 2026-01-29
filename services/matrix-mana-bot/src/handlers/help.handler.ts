import { Injectable } from '@nestjs/common';
import { AiService, TodoService } from '@manacore/bot-services';
import { CommandContext } from '../bot/command-router.service';
import { HELP_TEXT } from '../config/configuration';

@Injectable()
export class HelpHandler {
	constructor(
		private aiService: AiService,
		private todoService: TodoService
	) {}

	async showHelp(ctx: CommandContext): Promise<string> {
		return HELP_TEXT;
	}

	async showStatus(ctx: CommandContext): Promise<string> {
		const aiConnected = await this.aiService.checkConnection();
		const todoStats = await this.todoService.getStats(ctx.userId);

		const aiStatus = aiConnected ? '✅ Online' : '❌ Offline';
		const currentModel = this.aiService.getSession(ctx.userId)?.model || this.aiService.getDefaultModel();

		return `**📊 Status**

**AI/Ollama**
• Verbindung: ${aiStatus}
• Modell: \`${currentModel}\`

**Todos**
• Offen: ${todoStats.pending}
• Heute fällig: ${todoStats.today}
• Erledigt: ${todoStats.completed}

**Bot**
• Status: ✅ Online
• DSGVO: ✅ Alle Daten lokal`;
	}
}
