import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TranscribeRequestDto {
	language?: string;
	model?: string;
}

@Injectable()
export class SttProxyService {
	private readonly sttUrl: string;

	constructor(private readonly configService: ConfigService) {
		this.sttUrl = this.configService.get('services.stt') || 'http://localhost:3020';
	}

	async transcribe(file: Express.Multer.File, options: TranscribeRequestDto): Promise<any> {
		const formData = new FormData();
		const uint8Array = new Uint8Array(file.buffer);
		formData.append('file', new Blob([uint8Array], { type: file.mimetype }), file.originalname);

		if (options.language) {
			formData.append('language', options.language);
		}
		if (options.model) {
			formData.append('model', options.model);
		}

		const response = await fetch(`${this.sttUrl}/api/v1/transcribe`, {
			method: 'POST',
			body: formData,
		});

		if (!response.ok) {
			const error = await response.text();
			throw new HttpException(
				`STT service error: ${error}`,
				response.status || HttpStatus.BAD_GATEWAY
			);
		}

		return response.json();
	}

	async getModels(): Promise<any> {
		const response = await fetch(`${this.sttUrl}/api/v1/models`);

		if (!response.ok) {
			throw new HttpException('Failed to get STT models', HttpStatus.BAD_GATEWAY);
		}

		return response.json();
	}

	async getLanguages(): Promise<any> {
		const response = await fetch(`${this.sttUrl}/api/v1/languages`);

		if (!response.ok) {
			throw new HttpException('Failed to get STT languages', HttpStatus.BAD_GATEWAY);
		}

		return response.json();
	}
}
