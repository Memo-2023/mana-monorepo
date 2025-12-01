import {
	Injectable,
	BadRequestException,
	InternalServerErrorException,
	Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerateGameDto, GenerateGameResponseDto } from './dto/generate-game.dto';
import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import { AzureOpenAI } from '@azure/openai';

type AIProvider = 'google' | 'anthropic' | 'azure';

interface ModelConfig {
	provider: AIProvider;
	modelId: string;
	displayName: string;
}

@Injectable()
export class GameGeneratorService {
	private readonly logger = new Logger(GameGeneratorService.name);

	// Model configurations
	private readonly modelConfigs: Record<string, ModelConfig> = {
		// Google Gemini Models
		'gemini-2.0-flash': {
			provider: 'google',
			modelId: 'gemini-2.0-flash',
			displayName: 'Gemini 2.0 Flash',
		},
		'gemini-2.5-flash': {
			provider: 'google',
			modelId: 'gemini-2.5-flash-preview-05-20',
			displayName: 'Gemini 2.5 Flash',
		},
		'gemini-2.5-pro': {
			provider: 'google',
			modelId: 'gemini-2.5-pro-preview-05-06',
			displayName: 'Gemini 2.5 Pro',
		},
		// Anthropic Claude Models
		'claude-3.5-haiku': {
			provider: 'anthropic',
			modelId: 'claude-3-5-haiku-20241022',
			displayName: 'Claude 3.5 Haiku',
		},
		'claude-3.5-sonnet': {
			provider: 'anthropic',
			modelId: 'claude-sonnet-4-20250514',
			displayName: 'Claude Sonnet 4',
		},
		// Azure OpenAI Models
		'gpt-4o': { provider: 'azure', modelId: 'gpt-4o', displayName: 'GPT-4o' },
		'gpt-4o-mini': { provider: 'azure', modelId: 'gpt-4o-mini', displayName: 'GPT-4o Mini' },
	};

	// AI Clients
	private googleClient: GoogleGenAI | null = null;
	private anthropicClient: Anthropic | null = null;
	private azureClient: AzureOpenAI | null = null;

	constructor(private readonly configService: ConfigService) {
		this.initializeClients();
	}

	private initializeClients(): void {
		// Initialize Google Gemini
		const googleApiKey = this.configService.get<string>('GOOGLE_GENAI_API_KEY');
		if (googleApiKey && googleApiKey !== 'your_google_genai_key_here') {
			this.googleClient = new GoogleGenAI({ apiKey: googleApiKey });
			this.logger.log('Google Gemini client initialized');
		}

		// Initialize Anthropic Claude
		const anthropicApiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
		if (anthropicApiKey && anthropicApiKey !== 'your_anthropic_key_here') {
			this.anthropicClient = new Anthropic({ apiKey: anthropicApiKey });
			this.logger.log('Anthropic Claude client initialized');
		}

		// Initialize Azure OpenAI
		const azureEndpoint = this.configService.get<string>('AZURE_OPENAI_ENDPOINT');
		const azureApiKey = this.configService.get<string>('AZURE_OPENAI_API_KEY');
		if (azureEndpoint && azureApiKey && azureApiKey !== 'your_azure_openai_key_here') {
			this.azureClient = new AzureOpenAI({
				endpoint: azureEndpoint,
				apiKey: azureApiKey,
				apiVersion: '2024-08-01-preview',
			});
			this.logger.log('Azure OpenAI client initialized');
		}
	}

	async generateGame(dto: GenerateGameDto): Promise<GenerateGameResponseDto> {
		const model = dto.model || 'gemini-2.0-flash';
		const config = this.modelConfigs[model];

		if (!config) {
			this.logger.warn(`Unknown model: ${model}, falling back to gemini-2.0-flash`);
			return this.generateGame({ ...dto, model: 'gemini-2.0-flash' });
		}

		// Check if the provider is available
		const providerAvailable = this.isProviderAvailable(config.provider);
		if (!providerAvailable) {
			this.logger.error(`Provider ${config.provider} is not configured`);
			throw new InternalServerErrorException(
				`AI provider ${config.provider} is not configured. Please add the API key.`
			);
		}

		// Build prompt
		const prompt = this.createGamePrompt(
			dto.description.trim(),
			dto.mode || 'create',
			dto.originalPrompt,
			dto.currentCode
		);

		this.logger.log(
			`${dto.mode === 'iterate' ? 'Iterating' : 'Generating'} game with model: ${config.displayName} (${config.provider})`
		);

		try {
			let generatedContent: string;

			switch (config.provider) {
				case 'google':
					generatedContent = await this.generateWithGoogle(config.modelId, prompt);
					break;
				case 'anthropic':
					generatedContent = await this.generateWithAnthropic(config.modelId, prompt);
					break;
				case 'azure':
					generatedContent = await this.generateWithAzure(config.modelId, prompt);
					break;
				default:
					throw new InternalServerErrorException(`Unknown provider: ${config.provider}`);
			}

			// Extract HTML from response
			let html = generatedContent;
			const htmlMatch = generatedContent.match(/```html\n([\s\S]*?)\n```/);
			if (htmlMatch) {
				html = htmlMatch[1];
			}

			// Validate and sanitize
			const safeHtml = this.validateAndSanitizeGame(html);

			this.logger.log(`Game generated successfully with ${config.displayName}`);

			return {
				success: true,
				html: safeHtml,
				metadata: {
					description: dto.description.trim(),
					generatedAt: new Date().toISOString(),
				},
			};
		} catch (error: any) {
			if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
				throw error;
			}
			this.logger.error(`Generation error with ${config.displayName}:`, error);
			throw new InternalServerErrorException(
				`Failed to generate game: ${error.message || 'Unknown error'}`
			);
		}
	}

	private isProviderAvailable(provider: AIProvider): boolean {
		switch (provider) {
			case 'google':
				return this.googleClient !== null;
			case 'anthropic':
				return this.anthropicClient !== null;
			case 'azure':
				return this.azureClient !== null;
			default:
				return false;
		}
	}

	private async generateWithGoogle(modelId: string, prompt: string): Promise<string> {
		if (!this.googleClient) {
			throw new InternalServerErrorException('Google Gemini client not initialized');
		}

		const response = await this.googleClient.models.generateContent({
			model: modelId,
			contents: prompt,
			config: {
				temperature: 0.7,
				maxOutputTokens: 8192,
			},
		});

		const content = response.text;
		if (!content) {
			throw new InternalServerErrorException('No content generated by Google Gemini');
		}

		return content;
	}

	private async generateWithAnthropic(modelId: string, prompt: string): Promise<string> {
		if (!this.anthropicClient) {
			throw new InternalServerErrorException('Anthropic Claude client not initialized');
		}

		const response = await this.anthropicClient.messages.create({
			model: modelId,
			max_tokens: 8192,
			messages: [{ role: 'user', content: prompt }],
		});

		const content = response.content[0];
		if (!content || content.type !== 'text') {
			throw new InternalServerErrorException('No content generated by Anthropic Claude');
		}

		return content.text;
	}

	private async generateWithAzure(modelId: string, prompt: string): Promise<string> {
		if (!this.azureClient) {
			throw new InternalServerErrorException('Azure OpenAI client not initialized');
		}

		const deployment = this.configService.get<string>('AZURE_OPENAI_DEPLOYMENT') || modelId;

		const response = await this.azureClient.chat.completions.create({
			model: deployment,
			messages: [{ role: 'user', content: prompt }],
			temperature: 0.7,
			max_tokens: 8192,
		});

		const content = response.choices?.[0]?.message?.content;
		if (!content) {
			throw new InternalServerErrorException('No content generated by Azure OpenAI');
		}

		return content;
	}

	getAvailableModels(): { id: string; name: string; provider: string; available: boolean }[] {
		return Object.entries(this.modelConfigs).map(([id, config]) => ({
			id,
			name: config.displayName,
			provider: config.provider,
			available: this.isProviderAvailable(config.provider),
		}));
	}

	private createGamePrompt(
		description: string,
		mode: 'create' | 'iterate',
		originalPrompt?: string,
		currentCode?: string
	): string {
		if (mode === 'iterate' && originalPrompt && currentCode) {
			return `Du bist ein begabter Coder und Gamedesigner.

Der Nutzer hat ursprünglich folgendes Spiel gewünscht: "${originalPrompt}"

Jetzt möchte der Nutzer folgende Änderung: "${description}"

ERSTELLE DAS SPIEL KOMPLETT NEU mit den gewünschten Änderungen. Orientiere dich am ursprünglichen Konzept, aber implementiere die Änderungen vollständig.

WICHTIGE REGELN:
- Erstelle ein VOLLSTÄNDIGES neues HTML-Dokument
- Maximal 400 Zeilen Code insgesamt
- Nutze Canvas für die Grafik
- Das Spiel muss sofort spielbar sein
- Implementiere die gewünschten Änderungen vollständig
- PostMessage Integration: window.parent.postMessage({type: 'GAME_LOADED', gameId: 'generated'}, '*');

STRUKTUR:
<!DOCTYPE html>
<html>
<head>
    <title>Spielname</title>
    <style>
        body { margin: 0; background: #000; display: flex; justify-content: center; align-items: center; height: 100vh; }
        canvas { border: 1px solid #333; }
    </style>
</head>
<body>
    <canvas id="game" width="800" height="600"></canvas>
    <script>
        const canvas = document.getElementById('game');
        const ctx = canvas.getContext('2d');

        // Spielcode hier mit den gewünschten Änderungen
        window.parent.postMessage({type: 'GAME_LOADED', gameId: 'generated'}, '*');
    </script>
</body>
</html>

Schreibe nur den Code, keine weiteren Kommentare. Nutze keine externen Bibliotheken, Bilder oder Sounds.`;
		}

		return `Du bist ein begabter Coder und Gamedesigner. Erstelle ein HTML5-Spiel basierend auf dieser Beschreibung: ${description}

WICHTIGE REGELN:
- Maximal 400 Zeilen Code insgesamt
- Nutze Canvas für die Grafik
- Verwende einfache Formen (Rechtecke, Kreise, etc.)
- Das Spiel muss sofort spielbar sein
- Füge Steuerungshinweise im Spiel ein
- PostMessage Integration: window.parent.postMessage({type: 'GAME_LOADED', gameId: 'generated'}, '*');

STRUKTUR:
<!DOCTYPE html>
<html>
<head>
    <title>Spielname</title>
    <style>
        body { margin: 0; background: #000; display: flex; justify-content: center; align-items: center; height: 100vh; }
        canvas { border: 1px solid #333; }
    </style>
</head>
<body>
    <canvas id="game" width="800" height="600"></canvas>
    <script>
        const canvas = document.getElementById('game');
        const ctx = canvas.getContext('2d');

        // Spielcode hier
        // PostMessage beim Start senden:
        window.parent.postMessage({type: 'GAME_LOADED', gameId: 'generated'}, '*');
    </script>
</body>
</html>

Schreibe nur den Code, keine weiteren Kommentare. Nutze keine externen Bibliotheken, Bilder oder Sounds.`;
	}

	private validateAndSanitizeGame(html: string): string {
		if (!html || typeof html !== 'string') {
			throw new BadRequestException('Invalid HTML content');
		}

		if (!html.includes('<!DOCTYPE html>')) {
			throw new BadRequestException('Invalid game HTML structure');
		}

		// Security sanitization
		const sanitized = html
			.replace(/<script[^>]*src=[^>]*>/gi, '')
			.replace(/<link[^>]*href=[^>]*>/gi, '')
			.replace(/fetch\s*\(/gi, '// fetch disabled: fetch(')
			.replace(/XMLHttpRequest/gi, '// XMLHttpRequest disabled')
			.replace(/eval\s*\(/gi, '// eval disabled: eval(');

		return sanitized;
	}
}
