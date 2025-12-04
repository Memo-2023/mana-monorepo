import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { eq, and, gt, or, isNull } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { sharedDecks, slides } from '../db/schema';
import { type DeckService } from '../deck/deck.service';
import { randomBytes } from 'crypto';

@Injectable()
export class ShareService {
	constructor(
		@Inject(DATABASE_CONNECTION)
		private readonly db: Database,
		private readonly deckService: DeckService
	) {}

	private generateShareCode(): string {
		return randomBytes(6).toString('hex'); // 12 character code
	}

	async createShare(deckId: string, userId: string, expiresAt?: Date) {
		// Verify ownership
		const isOwner = await this.deckService.verifyOwnership(deckId, userId);
		if (!isOwner) {
			throw new ForbiddenException('You do not own this deck');
		}

		// Check if there's already a valid share
		const existingShare = await this.db.query.sharedDecks.findFirst({
			where: and(
				eq(sharedDecks.deckId, deckId),
				or(isNull(sharedDecks.expiresAt), gt(sharedDecks.expiresAt, new Date()))
			),
		});

		if (existingShare) {
			return existingShare;
		}

		// Create new share
		const [share] = await this.db
			.insert(sharedDecks)
			.values({
				deckId,
				shareCode: this.generateShareCode(),
				expiresAt: expiresAt || null,
			})
			.returning();

		return share;
	}

	async findByShareCode(shareCode: string) {
		const share = await this.db.query.sharedDecks.findFirst({
			where: and(
				eq(sharedDecks.shareCode, shareCode),
				or(isNull(sharedDecks.expiresAt), gt(sharedDecks.expiresAt, new Date()))
			),
			with: {
				deck: {
					with: {
						slides: {
							orderBy: [slides.order],
						},
						theme: true,
					},
				},
			},
		});

		if (!share) {
			throw new NotFoundException('Shared deck not found or link has expired');
		}

		return share.deck;
	}

	async getSharesForDeck(deckId: string, userId: string) {
		// Verify ownership
		const isOwner = await this.deckService.verifyOwnership(deckId, userId);
		if (!isOwner) {
			throw new ForbiddenException('You do not own this deck');
		}

		return this.db.query.sharedDecks.findMany({
			where: eq(sharedDecks.deckId, deckId),
		});
	}

	async deleteShare(shareId: string, userId: string) {
		const share = await this.db.query.sharedDecks.findFirst({
			where: eq(sharedDecks.id, shareId),
			with: {
				deck: true,
			},
		});

		if (!share) {
			throw new NotFoundException('Share not found');
		}

		// Verify ownership of the deck
		if (share.deck.userId !== userId) {
			throw new ForbiddenException('You do not own this deck');
		}

		await this.db.delete(sharedDecks).where(eq(sharedDecks.id, shareId));

		return { success: true };
	}
}
