import { Injectable, Logger } from '@nestjs/common';
import { LinkRepository } from '../database/repositories';
import type { Link } from '@manacore/uload-database';

export interface RedirectResult {
	success: boolean;
	targetUrl?: string;
	linkId?: string;
	error?: 'not_found' | 'expired' | 'inactive' | 'max_clicks' | 'password_required';
}

@Injectable()
export class RedirectService {
	private readonly logger = new Logger(RedirectService.name);

	constructor(private readonly linkRepository: LinkRepository) {}

	async getRedirect(shortCode: string): Promise<RedirectResult> {
		const link = await this.linkRepository.findByShortCode(shortCode);

		if (!link) {
			return { success: false, error: 'not_found' };
		}

		// Check if link is active
		if (!link.isActive) {
			return { success: false, error: 'inactive', linkId: link.id };
		}

		// Check if link has expired
		if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
			return { success: false, error: 'expired', linkId: link.id };
		}

		// Check max clicks
		if (link.maxClicks && (link.clickCount ?? 0) >= link.maxClicks) {
			return { success: false, error: 'max_clicks', linkId: link.id };
		}

		// Check if password protected
		if (link.password) {
			return { success: false, error: 'password_required', linkId: link.id };
		}

		return {
			success: true,
			targetUrl: link.originalUrl,
			linkId: link.id,
		};
	}

	async verifyPassword(shortCode: string, password: string): Promise<RedirectResult> {
		const link = await this.linkRepository.findByShortCode(shortCode);

		if (!link) {
			return { success: false, error: 'not_found' };
		}

		// TODO: Compare hashed passwords
		if (link.password !== password) {
			return { success: false, error: 'password_required', linkId: link.id };
		}

		return {
			success: true,
			targetUrl: link.originalUrl,
			linkId: link.id,
		};
	}

	async incrementClickCount(linkId: string): Promise<void> {
		await this.linkRepository.incrementClickCount(linkId);
	}
}
