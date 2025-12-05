import { Injectable, Inject } from '@nestjs/common';
import { eq, and, sql, avg, count } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { votes, type NewVote } from '../db/schema';
import { createHash } from 'crypto';

@Injectable()
export class VotesService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	private hashIp(ip: string): string {
		return createHash('sha256').update(ip).digest('hex').substring(0, 32);
	}

	async createVote(
		softwareId: string,
		metric: string,
		rating: number,
		ipAddress: string
	): Promise<{ success: boolean; newAverage: number; voteCount: number }> {
		const ipHash = this.hashIp(ipAddress);

		// Check if user already voted for this metric
		const existingVote = await this.db
			.select()
			.from(votes)
			.where(and(eq(votes.softwareId, softwareId), eq(votes.metric, metric), eq(votes.ipHash, ipHash)))
			.limit(1);

		if (existingVote.length > 0) {
			// Update existing vote
			await this.db
				.update(votes)
				.set({ rating, createdAt: new Date() })
				.where(eq(votes.id, existingVote[0].id));
		} else {
			// Create new vote
			const newVote: NewVote = {
				softwareId,
				metric,
				rating,
				ipHash,
			};
			await this.db.insert(votes).values(newVote);
		}

		// Get updated metrics
		const metrics = await this.getMetrics(softwareId, metric);
		return {
			success: true,
			newAverage: metrics.averageRating,
			voteCount: metrics.voteCount,
		};
	}

	async getMetrics(
		softwareId: string,
		metric?: string
	): Promise<{ averageRating: number; voteCount: number }> {
		const conditions = metric
			? and(eq(votes.softwareId, softwareId), eq(votes.metric, metric))
			: eq(votes.softwareId, softwareId);

		const result = await this.db
			.select({
				averageRating: avg(votes.rating),
				voteCount: count(votes.id),
			})
			.from(votes)
			.where(conditions);

		return {
			averageRating: parseFloat(result[0]?.averageRating || '0') || 0,
			voteCount: result[0]?.voteCount || 0,
		};
	}

	async getAllMetrics(
		softwareId: string
	): Promise<{ metric: string; averageRating: number; voteCount: number }[]> {
		const result = await this.db
			.select({
				metric: votes.metric,
				averageRating: avg(votes.rating),
				voteCount: count(votes.id),
			})
			.from(votes)
			.where(eq(votes.softwareId, softwareId))
			.groupBy(votes.metric);

		return result.map((r) => ({
			metric: r.metric,
			averageRating: parseFloat(r.averageRating || '0') || 0,
			voteCount: r.voteCount || 0,
		}));
	}
}
