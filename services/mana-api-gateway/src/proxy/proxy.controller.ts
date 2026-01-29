import {
	Controller,
	Post,
	Get,
	Body,
	UseGuards,
	UseInterceptors,
	UploadedFile,
	Res,
	Query,
} from '@nestjs/common';
import {
	ApiTags,
	ApiSecurity,
	ApiOperation,
	ApiResponse,
	ApiConsumes,
	ApiBody,
	ApiHeader,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { RateLimitGuard } from '../guards/rate-limit.guard';
import { CreditsGuard } from '../guards/credits.guard';
import { UsageTrackingInterceptor } from '../common/interceptors/usage-tracking.interceptor';
import { ApiKeyParam } from '../common/decorators/api-key.decorator';
import { ApiKeyData } from '../api-keys/api-keys.service';
import {
	SearchProxyService,
	SearchRequestDto,
	ExtractRequestDto,
	BulkExtractRequestDto,
} from './services/search-proxy.service';
import { SttProxyService, TranscribeRequestDto } from './services/stt-proxy.service';
import { TtsProxyService, SynthesizeRequestDto } from './services/tts-proxy.service';

@ApiSecurity('api-key')
@ApiHeader({
	name: 'X-API-Key',
	description: 'Your API key (sk_live_xxx or sk_test_xxx)',
	required: true,
})
@Controller('v1')
@UseGuards(ApiKeyGuard, RateLimitGuard, CreditsGuard)
@UseInterceptors(UsageTrackingInterceptor)
export class ProxyController {
	constructor(
		private readonly searchProxy: SearchProxyService,
		private readonly sttProxy: SttProxyService,
		private readonly ttsProxy: TtsProxyService
	) {}

	// === SEARCH ===

	@Post('search')
	@ApiTags('Search')
	@ApiOperation({
		summary: 'Web search',
		description: 'Search the web using multiple search engines. Costs 1 credit per request.',
	})
	@ApiBody({
		schema: {
			type: 'object',
			required: ['query'],
			properties: {
				query: { type: 'string', example: 'quantum computing' },
				options: {
					type: 'object',
					properties: {
						categories: {
							type: 'array',
							items: { type: 'string' },
							example: ['general', 'science'],
						},
						engines: { type: 'array', items: { type: 'string' }, example: ['google', 'bing'] },
						language: { type: 'string', example: 'en' },
						limit: { type: 'number', example: 10 },
					},
				},
			},
		},
	})
	@ApiResponse({ status: 200, description: 'Search results' })
	@ApiResponse({ status: 429, description: 'Rate limit exceeded' })
	@ApiResponse({ status: 402, description: 'Insufficient credits' })
	async search(@Body() body: SearchRequestDto, @ApiKeyParam() apiKey: ApiKeyData) {
		return this.searchProxy.search(body);
	}

	@Get('search/engines')
	@ApiTags('Search')
	@ApiOperation({
		summary: 'Get available search engines',
		description: 'Returns a list of available search engines and categories. Free endpoint.',
	})
	@ApiResponse({ status: 200, description: 'List of search engines' })
	async getEngines() {
		return this.searchProxy.getEngines();
	}

	@Post('extract')
	@ApiTags('Search')
	@ApiOperation({
		summary: 'Extract content from URL',
		description: 'Extracts main content from a webpage. Costs 1 credit per request.',
	})
	@ApiBody({
		schema: {
			type: 'object',
			required: ['url'],
			properties: {
				url: { type: 'string', example: 'https://example.com/article' },
				options: {
					type: 'object',
					properties: {
						includeMarkdown: { type: 'boolean', example: true },
						maxLength: { type: 'number', example: 5000 },
					},
				},
			},
		},
	})
	@ApiResponse({ status: 200, description: 'Extracted content' })
	async extract(@Body() body: ExtractRequestDto) {
		return this.searchProxy.extract(body);
	}

	@Post('extract/bulk')
	@ApiTags('Search')
	@ApiOperation({
		summary: 'Bulk extract content',
		description: 'Extracts content from multiple URLs (max 20). Costs 1 credit per URL.',
	})
	@ApiBody({
		schema: {
			type: 'object',
			required: ['urls'],
			properties: {
				urls: {
					type: 'array',
					items: { type: 'string' },
					example: ['https://example.com/article1', 'https://example.com/article2'],
				},
				options: {
					type: 'object',
					properties: {
						includeMarkdown: { type: 'boolean', example: true },
						maxLength: { type: 'number', example: 5000 },
					},
				},
				concurrency: { type: 'number', example: 5 },
			},
		},
	})
	@ApiResponse({ status: 200, description: 'Extracted content from all URLs' })
	async bulkExtract(@Body() body: BulkExtractRequestDto) {
		return this.searchProxy.bulkExtract(body);
	}

	// === STT ===

	@Post('stt/transcribe')
	@ApiTags('STT')
	@ApiOperation({
		summary: 'Transcribe audio to text',
		description:
			'Converts audio file to text. Costs 10 credits per minute of audio. Supports WAV, MP3, OGG, FLAC.',
	})
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		schema: {
			type: 'object',
			required: ['file'],
			properties: {
				file: { type: 'string', format: 'binary', description: 'Audio file' },
				language: { type: 'string', example: 'en', description: 'Language code (optional)' },
				model: { type: 'string', example: 'base', description: 'Model name (optional)' },
			},
		},
	})
	@ApiResponse({ status: 200, description: 'Transcription result' })
	@ApiResponse({ status: 400, description: 'Invalid audio file' })
	@UseInterceptors(FileInterceptor('file'))
	async transcribe(@UploadedFile() file: Express.Multer.File, @Body() body: TranscribeRequestDto) {
		return this.sttProxy.transcribe(file, body);
	}

	@Get('stt/models')
	@ApiTags('STT')
	@ApiOperation({
		summary: 'Get available STT models',
		description: 'Returns a list of available speech-to-text models. Free endpoint.',
	})
	@ApiResponse({ status: 200, description: 'List of STT models' })
	async getSttModels() {
		return this.sttProxy.getModels();
	}

	@Get('stt/languages')
	@ApiTags('STT')
	@ApiOperation({
		summary: 'Get supported languages',
		description: 'Returns a list of languages supported by STT. Free endpoint.',
	})
	@ApiResponse({ status: 200, description: 'List of supported languages' })
	async getSttLanguages() {
		return this.sttProxy.getLanguages();
	}

	// === TTS ===

	@Post('tts/synthesize')
	@ApiTags('TTS')
	@ApiOperation({
		summary: 'Synthesize text to speech',
		description:
			'Converts text to audio. Costs 1 credit per 1000 characters. Returns audio file (MP3, WAV, or OGG).',
	})
	@ApiBody({
		schema: {
			type: 'object',
			required: ['text'],
			properties: {
				text: { type: 'string', example: 'Hello, world! This is a test.' },
				voice: { type: 'string', example: 'en-US-1', description: 'Voice ID' },
				language: { type: 'string', example: 'en-US', description: 'Language code' },
				speed: { type: 'number', example: 1.0, minimum: 0.5, maximum: 2.0 },
				format: { type: 'string', enum: ['mp3', 'wav', 'ogg'], default: 'mp3' },
			},
		},
	})
	@ApiResponse({
		status: 200,
		description: 'Audio file',
		content: {
			'audio/mpeg': { schema: { type: 'string', format: 'binary' } },
			'audio/wav': { schema: { type: 'string', format: 'binary' } },
			'audio/ogg': { schema: { type: 'string', format: 'binary' } },
		},
	})
	async synthesize(@Body() body: SynthesizeRequestDto, @Res() res: Response) {
		const audio = await this.ttsProxy.synthesize(body);

		const format = body.format || 'mp3';
		const contentType =
			format === 'wav' ? 'audio/wav' : format === 'ogg' ? 'audio/ogg' : 'audio/mpeg';

		res.setHeader('Content-Type', contentType);
		res.setHeader('Content-Length', audio.length);
		res.send(audio);
	}

	@Get('tts/voices')
	@ApiTags('TTS')
	@ApiOperation({
		summary: 'Get available voices',
		description: 'Returns a list of available TTS voices. Free endpoint.',
	})
	@ApiResponse({ status: 200, description: 'List of available voices' })
	async getTtsVoices() {
		return this.ttsProxy.getVoices();
	}

	@Get('tts/languages')
	@ApiTags('TTS')
	@ApiOperation({
		summary: 'Get supported TTS languages',
		description: 'Returns a list of languages supported by TTS. Free endpoint.',
	})
	@ApiResponse({ status: 200, description: 'List of supported languages' })
	async getTtsLanguages() {
		return this.ttsProxy.getLanguages();
	}
}
