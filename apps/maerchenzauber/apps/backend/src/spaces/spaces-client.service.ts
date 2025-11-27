import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SpacesClientService {
	private readonly manaServiceUrl: string;

	constructor(
		private httpService: HttpService,
		private configService: ConfigService
	) {
		this.manaServiceUrl = this.configService.get<string>('MANA_SERVICE_URL') || '';
	}

	async getUserSpaces(token: string) {
		const response = await firstValueFrom(
			this.httpService.get<any>(`${this.manaServiceUrl}/spaces`, {
				headers: { Authorization: `Bearer ${token}` },
			})
		);
		return response.data;
	}

	async verifySpaceAccess(spaceId: string, token: string): Promise<boolean> {
		try {
			const response = await firstValueFrom(
				this.httpService.get<{ hasAccess: boolean }>(
					`${this.manaServiceUrl}/spaces/${spaceId}/access`,
					{
						headers: { Authorization: `Bearer ${token}` },
					}
				)
			);
			return response.data.hasAccess;
		} catch (error) {
			return false;
		}
	}
}
