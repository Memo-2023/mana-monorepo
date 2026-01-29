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
	async search(@Body() body: SearchRequestDto, @ApiKeyParam() apiKey: ApiKeyData) {
		return this.searchProxy.search(body);
	}

	@Get('search/engines')
	async getEngines() {
		return this.searchProxy.getEngines();
	}

	@Post('extract')
	async extract(@Body() body: ExtractRequestDto) {
		return this.searchProxy.extract(body);
	}

	@Post('extract/bulk')
	async bulkExtract(@Body() body: BulkExtractRequestDto) {
		return this.searchProxy.bulkExtract(body);
	}

	// === STT ===

	@Post('stt/transcribe')
	@UseInterceptors(FileInterceptor('file'))
	async transcribe(@UploadedFile() file: Express.Multer.File, @Body() body: TranscribeRequestDto) {
		return this.sttProxy.transcribe(file, body);
	}

	@Get('stt/models')
	async getSttModels() {
		return this.sttProxy.getModels();
	}

	@Get('stt/languages')
	async getSttLanguages() {
		return this.sttProxy.getLanguages();
	}

	// === TTS ===

	@Post('tts/synthesize')
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
	async getTtsVoices() {
		return this.ttsProxy.getVoices();
	}

	@Get('tts/languages')
	async getTtsLanguages() {
		return this.ttsProxy.getLanguages();
	}
}
