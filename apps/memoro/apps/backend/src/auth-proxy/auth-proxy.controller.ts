import {
	Controller,
	Post,
	Get,
	Body,
	Headers,
	HttpCode,
	HttpException,
	HttpStatus,
} from '@nestjs/common';
import { AuthProxyService } from './auth-proxy.service';

@Controller('auth')
export class AuthProxyController {
	constructor(private readonly authProxyService: AuthProxyService) {}

	@Post('signin')
	async signin(@Body() payload: any) {
		return this.authProxyService.signin(payload);
	}

	/**
	 * Signup endpoint
	 *
	 * Optional: Include metadata.branding to customize signup email
	 * If not provided, mana-core uses default branding for the app
	 *
	 * Example with custom branding:
	 * {
	 *   "email": "user@example.com",
	 *   "password": "pass123",
	 *   "deviceInfo": {...},
	 *   "metadata": {
	 *     "branding": {
	 *       "logoUrl": "custom-logo.svg",
	 *       "primaryColor": "#FF5733"
	 *     }
	 *   }
	 * }
	 */
	@Post('signup')
	async signup(@Body() payload: any) {
		return this.authProxyService.signup(payload);
	}

	@Post('google-signin')
	async googleSignin(@Body() payload: any) {
		return this.authProxyService.googleSignin(payload);
	}

	@Post('apple-signin')
	async appleSignin(@Body() payload: any) {
		return this.authProxyService.appleSignin(payload);
	}

	@Post('refresh')
	async refresh(@Body() payload: any) {
		return this.authProxyService.refresh(payload);
	}

	@Post('logout')
	@HttpCode(204)
	async logout(@Body() payload: any) {
		return this.authProxyService.logout(payload);
	}

	@Post('forgot-password')
	async forgotPassword(@Body() payload: any) {
		return this.authProxyService.forgotPassword(payload);
	}

	@Post('validate')
	async validate(@Body() payload: any) {
		return this.authProxyService.validate(payload);
	}

	@Get('credits')
	async getCredits(@Headers('authorization') authorization: string) {
		if (!authorization) {
			throw new HttpException('Authorization header required', HttpStatus.UNAUTHORIZED);
		}
		return this.authProxyService.getCredits(authorization);
	}

	// Device management endpoints
	@Get('devices')
	async getDevices(@Headers('authorization') authorization: string) {
		if (!authorization) {
			throw new HttpException('Authorization header required', HttpStatus.UNAUTHORIZED);
		}
		return this.authProxyService.getDevices(authorization);
	}
}
