import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { presets, type Preset, type PresetSettings } from '../db/schema';
import { CreatePresetDto, UpdatePresetDto } from './dto';

@Injectable()
export class PresetService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findAll(userId: string): Promise<Preset[]> {
		return this.db.select().from(presets).where(eq(presets.userId, userId));
	}

	async findById(id: string, userId: string): Promise<Preset | null> {
		const result = await this.db
			.select()
			.from(presets)
			.where(and(eq(presets.id, id), eq(presets.userId, userId)))
			.limit(1);
		return result[0] || null;
	}

	async findByIdOrThrow(id: string, userId: string): Promise<Preset> {
		const preset = await this.findById(id, userId);
		if (!preset) {
			throw new NotFoundException(`Preset with id ${id} not found`);
		}
		return preset;
	}

	async create(userId: string, dto: CreatePresetDto): Promise<Preset> {
		const result = await this.db
			.insert(presets)
			.values({
				userId,
				type: dto.type,
				name: dto.name,
				durationSeconds: dto.durationSeconds,
				settings: dto.settings as PresetSettings,
			})
			.returning();
		return result[0];
	}

	async update(id: string, userId: string, dto: UpdatePresetDto): Promise<Preset> {
		await this.findByIdOrThrow(id, userId);

		const result = await this.db
			.update(presets)
			.set({
				...dto,
				settings: dto.settings as PresetSettings,
			})
			.where(and(eq(presets.id, id), eq(presets.userId, userId)))
			.returning();
		return result[0];
	}

	async delete(id: string, userId: string): Promise<void> {
		await this.findByIdOrThrow(id, userId);
		await this.db.delete(presets).where(and(eq(presets.id, id), eq(presets.userId, userId)));
	}
}
