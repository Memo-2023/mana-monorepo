import { Controller, Get, Delete, UseGuards, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { MeService } from './me.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, type CurrentUserData } from '../common/decorators/current-user.decorator';

/**
 * Self-service endpoints for users to manage their own data.
 * GDPR compliance: view, export, and delete personal data.
 *
 * All endpoints require authentication via JwtAuthGuard.
 * User ID is extracted from the JWT token - no userId parameter needed.
 */
@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
	constructor(private readonly meService: MeService) {}

	/**
	 * Get the authenticated user's data summary.
	 * Returns aggregated data from auth, credits, and all connected project backends.
	 */
	@Get('data')
	async getMyData(@CurrentUser() user: CurrentUserData) {
		return this.meService.getMyData(user.userId);
	}

	/**
	 * Export the authenticated user's data as a JSON file download.
	 * GDPR Article 20: Right to data portability.
	 */
	@Get('data/export')
	async exportMyData(@CurrentUser() user: CurrentUserData, @Res() res: Response) {
		const exportData = await this.meService.exportMyData(user.userId);

		const filename = `meine-daten-${new Date().toISOString().split('T')[0]}.json`;

		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
		res.status(HttpStatus.OK).send(JSON.stringify(exportData, null, 2));
	}

	/**
	 * Delete all data for the authenticated user.
	 * GDPR Article 17: Right to erasure ("right to be forgotten").
	 *
	 * This performs a soft-delete of the user account and hard-deletes all associated data.
	 * The operation is irreversible.
	 */
	@Delete('data')
	async deleteMyData(@CurrentUser() user: CurrentUserData) {
		return this.meService.deleteMyData(user.userId);
	}
}
