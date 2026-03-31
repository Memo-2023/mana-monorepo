import { Injectable, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Observable, catchError, firstValueFrom, map } from 'rxjs';
import { AxiosError } from 'axios';
import { JwtPayload } from '../types/jwt-payload.interface';

@Injectable()
export class AuthClientService {
	private authServiceUrl: string;
	private memoroAppId: string;

	constructor(
		private httpService: HttpService,
		private configService: ConfigService
	) {
		this.authServiceUrl = this.configService.get<string>(
			'MANA_SERVICE_URL',
			'http://localhost:3000'
		);
		this.memoroAppId = this.configService.get<string>(
			'MEMORO_APP_ID',
			'973da0c1-b479-4dac-a1b0-ed09c72caca8'
		);
	}

	/**
	 * Validates a JWT token by calling the Auth service
	 */
	async validateToken(token: string): Promise<JwtPayload> {
		try {
			console.log('Calling: ', `${this.authServiceUrl}/auth/validate?appId=${this.memoroAppId}`);
			console.log('Memoro App ID: ', this.memoroAppId);
			const response = await firstValueFrom(
				this.httpService
					.post(
						`${this.authServiceUrl}/auth/validate?appId=${this.memoroAppId}`,
						{ appToken: token },
						{
							headers: {
								'Content-Type': 'application/json',
							},
						}
					)
					.pipe(
						map((response) => response.data),
						catchError((error: AxiosError) => {
							throw new UnauthorizedException('Invalid token');
						})
					)
			);

			if (response.valid && response.user) {
				return response.user;
			} else {
				throw new UnauthorizedException('Invalid token response format');
			}
		} catch (error) {
			throw new UnauthorizedException('Invalid token');
		}
	}

	/**
	 * Refreshes a token by calling the Auth service
	 */
	async refreshToken(refreshToken: string): Promise<{ appToken: string; refreshToken: string }> {
		try {
			const response = await firstValueFrom(
				this.httpService
					.post(
						`${this.authServiceUrl}/auth/refresh`,
						{ refreshToken, appId: this.memoroAppId },
						{
							headers: {
								'Content-Type': 'application/json',
							},
						}
					)
					.pipe(
						map((response) => response.data),
						catchError((error: AxiosError) => {
							throw new UnauthorizedException('Invalid refresh token');
						})
					)
			);

			return response;
		} catch (error) {
			throw new UnauthorizedException('Invalid refresh token');
		}
	}
}
