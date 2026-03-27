import {
	Controller,
	Post,
	Body,
	Get,
	UseGuards,
	UseInterceptors,
	UploadedFile,
	Res,
	Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '@manacore/shared-nestjs-auth';
import { VoiceService } from './voice.service';

@Controller('voice')
@UseGuards(JwtAuthGuard)
export class VoiceController {
	constructor(private readonly voiceService: VoiceService) {}

	/** Check GPU voice services availability. */
	@Get('health')
	async health() {
		return this.voiceService.healthCheck();
	}

	/**
	 * Transcribe audio to text.
	 * POST /api/v1/voice/transcribe
	 *
	 * Body: multipart/form-data with "file" field
	 * Query: ?language=de&diarize=true
	 */
	@Post('transcribe')
	@UseInterceptors(FileInterceptor('file'))
	async transcribe(
		@UploadedFile() file: Express.Multer.File,
		@Query('language') language?: string,
		@Query('diarize') diarize?: string
	) {
		if (!file) {
			return { error: 'No audio file provided' };
		}

		return this.voiceService.transcribe(file.buffer, file.originalname, {
			language: language || 'de',
			diarize: diarize === 'true',
		});
	}

	/**
	 * Synthesize text to speech.
	 * POST /api/v1/voice/synthesize
	 *
	 * Returns audio file directly.
	 */
	@Post('synthesize')
	async synthesize(
		@Body() body: { text: string; voice?: string; speed?: number; format?: 'wav' | 'mp3' },
		@Res() res: Response
	) {
		const result = await this.voiceService.synthesize(body.text, {
			voice: body.voice,
			speed: body.speed,
			format: body.format,
		});

		res.set({
			'Content-Type': result.contentType,
			'Content-Length': result.audio.length.toString(),
			'X-Duration': result.duration.toString(),
		});
		res.send(result.audio);
	}
}
