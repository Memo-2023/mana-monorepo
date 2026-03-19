import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, asc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { markers, beats, projects } from '../db/schema';
import type { Marker, NewMarker } from '../db/schema';

@Injectable()
export class MarkerService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async verifyBeatOwnership(beatId: string, userId: string): Promise<void> {
		const [beat] = await this.db.select().from(beats).where(eq(beats.id, beatId));
		if (!beat) {
			throw new NotFoundException('Beat not found');
		}
		const [project] = await this.db
			.select()
			.from(projects)
			.where(and(eq(projects.id, beat.projectId), eq(projects.userId, userId)));
		if (!project) {
			throw new NotFoundException('Project not found');
		}
	}

	async findByBeatId(beatId: string): Promise<Marker[]> {
		return this.db
			.select()
			.from(markers)
			.where(eq(markers.beatId, beatId))
			.orderBy(asc(markers.startTime));
	}

	async findById(id: string): Promise<Marker | null> {
		const [marker] = await this.db.select().from(markers).where(eq(markers.id, id));
		return marker || null;
	}

	async findByIdOrThrow(id: string): Promise<Marker> {
		const marker = await this.findById(id);
		if (!marker) {
			throw new NotFoundException('Marker not found');
		}
		return marker;
	}

	async create(data: NewMarker): Promise<Marker> {
		const [marker] = await this.db.insert(markers).values(data).returning();
		return marker;
	}

	async update(
		id: string,
		userId: string,
		data: Partial<Pick<Marker, 'type' | 'label' | 'startTime' | 'endTime' | 'color' | 'sortOrder'>>
	): Promise<Marker> {
		const marker = await this.findByIdOrThrow(id);
		await this.verifyBeatOwnership(marker.beatId, userId);

		const [updatedMarker] = await this.db
			.update(markers)
			.set(data)
			.where(eq(markers.id, id))
			.returning();
		return updatedMarker;
	}

	async delete(id: string, userId: string): Promise<void> {
		const marker = await this.findByIdOrThrow(id);
		await this.verifyBeatOwnership(marker.beatId, userId);
		await this.db.delete(markers).where(eq(markers.id, id));
	}

	async deleteAllForBeat(beatId: string, userId: string): Promise<void> {
		await this.verifyBeatOwnership(beatId, userId);
		await this.db.delete(markers).where(eq(markers.beatId, beatId));
	}

	async bulkCreate(
		beatId: string,
		userId: string,
		items: Omit<NewMarker, 'beatId'>[]
	): Promise<Marker[]> {
		await this.verifyBeatOwnership(beatId, userId);

		if (items.length === 0) return [];

		const values = items.map((item) => ({
			...item,
			beatId,
		}));

		return this.db.insert(markers).values(values).returning();
	}

	async bulkUpdate(
		userId: string,
		updates: Array<{
			id: string;
			data: Partial<Pick<Marker, 'startTime' | 'endTime' | 'sortOrder'>>;
		}>
	): Promise<Marker[]> {
		return this.db.transaction(async (tx) => {
			const results: Marker[] = [];
			for (const update of updates) {
				const marker = await this.findByIdOrThrow(update.id);
				await this.verifyBeatOwnership(marker.beatId, userId);

				const [updatedMarker] = await tx
					.update(markers)
					.set(update.data)
					.where(eq(markers.id, update.id))
					.returning();
				results.push(updatedMarker);
			}
			return results;
		});
	}
}
