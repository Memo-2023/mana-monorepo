import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { eq, max } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { slides, decks } from '../db/schema';
import { DeckService } from '../deck/deck.service';
import { CreateSlideDto } from './slide.dto';
import type { UpdateSlideDto, ReorderSlidesDto } from './slide.dto';

@Injectable()
export class SlideService {
	constructor(
		@Inject(DATABASE_CONNECTION)
		private readonly db: Database,
		private readonly deckService: DeckService
	) {}

	async create(deckId: string, userId: string, dto: CreateSlideDto) {
		// Verify deck ownership
		const isOwner = await this.deckService.verifyOwnership(deckId, userId);
		if (!isOwner) {
			throw new ForbiddenException('Not authorized to modify this deck');
		}

		// Get next order number
		const result = await this.db
			.select({ maxOrder: max(slides.order) })
			.from(slides)
			.where(eq(slides.deckId, deckId));

		const nextOrder = dto.order ?? (result[0]?.maxOrder ?? -1) + 1;

		const [slide] = await this.db
			.insert(slides)
			.values({
				deckId,
				order: nextOrder,
				content: dto.content,
			})
			.returning();

		// Update deck's updatedAt
		await this.db.update(decks).set({ updatedAt: new Date() }).where(eq(decks.id, deckId));

		return slide;
	}

	async update(id: string, userId: string, dto: UpdateSlideDto) {
		// Get slide and verify ownership
		const slide = await this.db.query.slides.findFirst({
			where: eq(slides.id, id),
			with: { deck: true },
		});

		if (!slide) {
			throw new NotFoundException('Slide not found');
		}

		if (slide.deck.userId !== userId) {
			throw new ForbiddenException('Not authorized to modify this slide');
		}

		const [updated] = await this.db
			.update(slides)
			.set({
				content: dto.content ?? slide.content,
				order: dto.order ?? slide.order,
			})
			.where(eq(slides.id, id))
			.returning();

		// Update deck's updatedAt
		await this.db.update(decks).set({ updatedAt: new Date() }).where(eq(decks.id, slide.deckId));

		return updated;
	}

	async remove(id: string, userId: string) {
		// Get slide and verify ownership
		const slide = await this.db.query.slides.findFirst({
			where: eq(slides.id, id),
			with: { deck: true },
		});

		if (!slide) {
			throw new NotFoundException('Slide not found');
		}

		if (slide.deck.userId !== userId) {
			throw new ForbiddenException('Not authorized to delete this slide');
		}

		await this.db.delete(slides).where(eq(slides.id, id));

		// Update deck's updatedAt
		await this.db.update(decks).set({ updatedAt: new Date() }).where(eq(decks.id, slide.deckId));

		return { success: true };
	}

	async reorder(userId: string, dto: ReorderSlidesDto) {
		// Verify ownership of all slides
		for (const item of dto.slides) {
			const slide = await this.db.query.slides.findFirst({
				where: eq(slides.id, item.id),
				with: { deck: true },
			});

			if (!slide) {
				throw new NotFoundException(`Slide ${item.id} not found`);
			}

			if (slide.deck.userId !== userId) {
				throw new ForbiddenException('Not authorized to reorder these slides');
			}
		}

		// Update orders
		for (const item of dto.slides) {
			await this.db.update(slides).set({ order: item.order }).where(eq(slides.id, item.id));
		}

		return { success: true };
	}
}
