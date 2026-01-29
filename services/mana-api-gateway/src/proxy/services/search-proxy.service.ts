import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SearchRequestDto {
	query: string;
	options?: {
		categories?: string[];
		engines?: string[];
		language?: string;
		limit?: number;
	};
}

export interface ExtractRequestDto {
	url: string;
	options?: {
		includeMarkdown?: boolean;
		maxLength?: number;
	};
}

export interface BulkExtractRequestDto {
	urls: string[];
	options?: {
		includeMarkdown?: boolean;
		maxLength?: number;
	};
	concurrency?: number;
}

@Injectable()
export class SearchProxyService {
	private readonly searchUrl: string;

	constructor(private readonly configService: ConfigService) {
		this.searchUrl = this.configService.get('services.search') || 'http://localhost:3021';
	}

	async search(body: SearchRequestDto): Promise<any> {
		const response = await fetch(`${this.searchUrl}/api/v1/search`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new HttpException(
				`Search service error: ${error}`,
				response.status || HttpStatus.BAD_GATEWAY
			);
		}

		return response.json();
	}

	async extract(body: ExtractRequestDto): Promise<any> {
		const response = await fetch(`${this.searchUrl}/api/v1/extract`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new HttpException(
				`Extract service error: ${error}`,
				response.status || HttpStatus.BAD_GATEWAY
			);
		}

		return response.json();
	}

	async bulkExtract(body: BulkExtractRequestDto): Promise<any> {
		const response = await fetch(`${this.searchUrl}/api/v1/extract/bulk`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new HttpException(
				`Bulk extract service error: ${error}`,
				response.status || HttpStatus.BAD_GATEWAY
			);
		}

		return response.json();
	}

	async getEngines(): Promise<any> {
		const response = await fetch(`${this.searchUrl}/api/v1/search/engines`);

		if (!response.ok) {
			throw new HttpException('Failed to get search engines', HttpStatus.BAD_GATEWAY);
		}

		return response.json();
	}
}
