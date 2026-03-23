import { Controller, Post, Body, UseGuards, BadRequestException, Req } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { AiService } from './ai.service';
import type { Request } from 'express';

/**
 * Extract userId from a JWT token payload without JWKS verification.
 * Used as fallback for Supabase tokens when mana-core-auth guard fails.
 */
function extractUserIdFromToken(authHeader: string | undefined): string | null {
	if (!authHeader?.startsWith('Bearer ')) return null;
	try {
		const token = authHeader.slice(7);
		const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
		return payload.sub || null;
	} catch {
		return null;
	}
}

@Controller('ai')
export class AiController {
	constructor(private readonly aiService: AiService) {}

	@Post('generate')
	@UseGuards(JwtAuthGuard)
	async generate(
		@CurrentUser() user: CurrentUserData,
		@Body()
		body: {
			prompt: string;
			model?: string;
			temperature?: number;
			maxTokens?: number;
			documentId?: string;
			referencedDocuments?: { title: string; content: string }[];
		}
	) {
		if (!body.prompt) {
			throw new BadRequestException('prompt is required');
		}

		const result = await this.aiService.generate(user.userId, body);
		return result;
	}

	/**
	 * Generate endpoint that accepts Supabase tokens (for mobile app).
	 * Falls back to extracting userId from JWT payload when mana-core-auth is not available.
	 */
	@Post('generate/mobile')
	async generateMobile(
		@Req() req: Request,
		@Body()
		body: {
			prompt: string;
			model?: string;
			temperature?: number;
			maxTokens?: number;
			documentId?: string;
			referencedDocuments?: { title: string; content: string }[];
		}
	) {
		if (!body.prompt) {
			throw new BadRequestException('prompt is required');
		}

		const userId = extractUserIdFromToken(req.headers.authorization);
		if (!userId) {
			throw new BadRequestException('Authorization required');
		}

		const result = await this.aiService.generate(userId, body);
		return result;
	}

	@Post('estimate')
	@UseGuards(JwtAuthGuard)
	async estimateCost(
		@CurrentUser() user: CurrentUserData,
		@Body()
		body: {
			prompt: string;
			model?: string;
			estimatedCompletionLength?: number;
			referencedDocuments?: { title: string; content: string }[];
		}
	) {
		const estimate = await this.aiService.estimateCost(user.userId, body);
		return estimate;
	}

	/**
	 * Estimate endpoint that accepts Supabase tokens (for mobile app).
	 */
	@Post('estimate/mobile')
	async estimateCostMobile(
		@Req() req: Request,
		@Body()
		body: {
			prompt: string;
			model?: string;
			estimatedCompletionLength?: number;
			referencedDocuments?: { title: string; content: string }[];
		}
	) {
		const userId = extractUserIdFromToken(req.headers.authorization);
		if (!userId) {
			throw new BadRequestException('Authorization required');
		}

		const estimate = await this.aiService.estimateCost(userId, body);
		return estimate;
	}
}
