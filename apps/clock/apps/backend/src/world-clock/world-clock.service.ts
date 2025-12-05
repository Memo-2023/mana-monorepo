import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, asc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { worldClocks, type WorldClock } from '../db/schema';
import { CreateWorldClockDto } from './dto';

// Common timezones with city names
const TIMEZONES = [
	{ timezone: 'America/New_York', city: 'New York' },
	{ timezone: 'America/Los_Angeles', city: 'Los Angeles' },
	{ timezone: 'America/Chicago', city: 'Chicago' },
	{ timezone: 'America/Denver', city: 'Denver' },
	{ timezone: 'America/Toronto', city: 'Toronto' },
	{ timezone: 'America/Vancouver', city: 'Vancouver' },
	{ timezone: 'America/Mexico_City', city: 'Mexico City' },
	{ timezone: 'America/Sao_Paulo', city: 'São Paulo' },
	{ timezone: 'America/Buenos_Aires', city: 'Buenos Aires' },
	{ timezone: 'Europe/London', city: 'London' },
	{ timezone: 'Europe/Paris', city: 'Paris' },
	{ timezone: 'Europe/Berlin', city: 'Berlin' },
	{ timezone: 'Europe/Rome', city: 'Rome' },
	{ timezone: 'Europe/Madrid', city: 'Madrid' },
	{ timezone: 'Europe/Amsterdam', city: 'Amsterdam' },
	{ timezone: 'Europe/Vienna', city: 'Vienna' },
	{ timezone: 'Europe/Zurich', city: 'Zurich' },
	{ timezone: 'Europe/Moscow', city: 'Moscow' },
	{ timezone: 'Europe/Istanbul', city: 'Istanbul' },
	{ timezone: 'Asia/Tokyo', city: 'Tokyo' },
	{ timezone: 'Asia/Shanghai', city: 'Shanghai' },
	{ timezone: 'Asia/Hong_Kong', city: 'Hong Kong' },
	{ timezone: 'Asia/Singapore', city: 'Singapore' },
	{ timezone: 'Asia/Seoul', city: 'Seoul' },
	{ timezone: 'Asia/Mumbai', city: 'Mumbai' },
	{ timezone: 'Asia/Dubai', city: 'Dubai' },
	{ timezone: 'Asia/Bangkok', city: 'Bangkok' },
	{ timezone: 'Asia/Jakarta', city: 'Jakarta' },
	{ timezone: 'Australia/Sydney', city: 'Sydney' },
	{ timezone: 'Australia/Melbourne', city: 'Melbourne' },
	{ timezone: 'Pacific/Auckland', city: 'Auckland' },
	{ timezone: 'Pacific/Honolulu', city: 'Honolulu' },
	{ timezone: 'Africa/Cairo', city: 'Cairo' },
	{ timezone: 'Africa/Johannesburg', city: 'Johannesburg' },
];

@Injectable()
export class WorldClockService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findAll(userId: string): Promise<WorldClock[]> {
		return this.db
			.select()
			.from(worldClocks)
			.where(eq(worldClocks.userId, userId))
			.orderBy(asc(worldClocks.sortOrder));
	}

	async findById(id: string, userId: string): Promise<WorldClock | null> {
		const result = await this.db
			.select()
			.from(worldClocks)
			.where(and(eq(worldClocks.id, id), eq(worldClocks.userId, userId)))
			.limit(1);
		return result[0] || null;
	}

	async findByIdOrThrow(id: string, userId: string): Promise<WorldClock> {
		const clock = await this.findById(id, userId);
		if (!clock) {
			throw new NotFoundException(`World clock with id ${id} not found`);
		}
		return clock;
	}

	async create(userId: string, dto: CreateWorldClockDto): Promise<WorldClock> {
		// Get the max sort order for this user
		const existing = await this.findAll(userId);
		const maxOrder = existing.length > 0 ? Math.max(...existing.map((c) => c.sortOrder)) : -1;

		const result = await this.db
			.insert(worldClocks)
			.values({
				userId,
				timezone: dto.timezone,
				cityName: dto.cityName,
				sortOrder: maxOrder + 1,
			})
			.returning();
		return result[0];
	}

	async reorder(userId: string, ids: string[]): Promise<WorldClock[]> {
		// Update sort order for each world clock
		for (let i = 0; i < ids.length; i++) {
			await this.db
				.update(worldClocks)
				.set({ sortOrder: i })
				.where(and(eq(worldClocks.id, ids[i]), eq(worldClocks.userId, userId)));
		}

		return this.findAll(userId);
	}

	async delete(id: string, userId: string): Promise<void> {
		await this.findByIdOrThrow(id, userId);
		await this.db
			.delete(worldClocks)
			.where(and(eq(worldClocks.id, id), eq(worldClocks.userId, userId)));
	}

	searchTimezones(query: string): { timezone: string; city: string }[] {
		if (!query || query.length < 2) {
			return TIMEZONES.slice(0, 10);
		}

		const lowerQuery = query.toLowerCase();
		return TIMEZONES.filter(
			(tz) =>
				tz.city.toLowerCase().includes(lowerQuery) || tz.timezone.toLowerCase().includes(lowerQuery)
		).slice(0, 20);
	}
}
