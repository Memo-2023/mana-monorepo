import { Controller, Get, Patch, Body, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';
import { SettingsClientService } from './settings-client.service';

@Controller('settings')
@UseGuards(AuthGuard)
export class SettingsController {
	constructor(private readonly settingsClientService: SettingsClientService) {}

	@Get()
	async getSettings(@Req() req) {
		const token = req.token;

		try {
			const settings = await this.settingsClientService.getUserSettings(token);
			return { settings };
		} catch (error) {
			throw new BadRequestException(`Failed to get settings: ${error.message}`);
		}
	}

	@Get('memoro')
	async getMemoroSettings(@Req() req) {
		const token = req.token;

		try {
			const memoSettings = await this.settingsClientService.getMemoroSettings(token);
			return { settings: memoSettings };
		} catch (error) {
			throw new BadRequestException(`Failed to get Memoro settings: ${error.message}`);
		}
	}

	@Patch('memoro')
	async updateMemoroSettings(
		@Req() req,
		@Body()
		body: {
			dataUsageAcceptance?: boolean;
			emailNewsletterOptIn?: boolean;
			[key: string]: any;
		}
	) {
		const token = req.token;

		if (Object.keys(body).length === 0) {
			throw new BadRequestException('At least one setting field is required');
		}

		try {
			const updatedSettings = await this.settingsClientService.updateMemoroSettings(body, token);
			return {
				success: true,
				settings: updatedSettings,
				message: 'Memoro settings updated successfully',
			};
		} catch (error) {
			throw new BadRequestException(`Failed to update Memoro settings: ${error.message}`);
		}
	}

	@Patch('memoro/data-usage')
	async updateDataUsageAcceptance(@Req() req, @Body() body: { accepted: boolean }) {
		const token = req.token;

		if (typeof body.accepted !== 'boolean') {
			throw new BadRequestException('accepted field must be a boolean');
		}

		try {
			const updatedSettings = await this.settingsClientService.updateDataUsageAcceptance(
				body.accepted,
				token
			);
			return {
				success: true,
				settings: updatedSettings,
				message: `Data usage ${body.accepted ? 'accepted' : 'declined'} successfully`,
			};
		} catch (error) {
			throw new BadRequestException(`Failed to update data usage acceptance: ${error.message}`);
		}
	}

	@Patch('memoro/email-newsletter')
	async updateEmailNewsletterOptIn(@Req() req, @Body() body: { optIn: boolean }) {
		const token = req.token;

		if (typeof body.optIn !== 'boolean') {
			throw new BadRequestException('optIn field must be a boolean');
		}

		try {
			const updatedSettings = await this.settingsClientService.updateEmailNewsletterOptIn(
				body.optIn,
				token
			);
			return {
				success: true,
				settings: updatedSettings,
				message: `Email newsletter ${body.optIn ? 'opted in' : 'opted out'} successfully`,
			};
		} catch (error) {
			throw new BadRequestException(`Failed to update email newsletter opt-in: ${error.message}`);
		}
	}

	@Patch('profile')
	async updateProfile(
		@Req() req,
		@Body()
		body: {
			firstName?: string;
			lastName?: string;
			avatarUrl?: string;
		}
	) {
		const token = req.token;

		if (Object.keys(body).length === 0) {
			throw new BadRequestException('At least one profile field is required');
		}

		try {
			const updatedUser = await this.settingsClientService.updateUserProfile(body, token);
			return {
				success: true,
				user: updatedUser,
				message: 'Profile updated successfully',
			};
		} catch (error) {
			throw new BadRequestException(`Failed to update profile: ${error.message}`);
		}
	}
}
