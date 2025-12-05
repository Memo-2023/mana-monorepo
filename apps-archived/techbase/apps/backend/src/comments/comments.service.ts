import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { comments, type Comment, type NewComment } from '../db/schema';
import { createHash } from 'crypto';

@Injectable()
export class CommentsService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	private hashIp(ip: string): string {
		return createHash('sha256').update(ip).digest('hex').substring(0, 32);
	}

	async createComment(
		softwareId: string,
		userName: string,
		commentText: string,
		ipAddress: string
	): Promise<{ success: boolean; message: string }> {
		const ipHash = this.hashIp(ipAddress);

		const newComment: NewComment = {
			softwareId,
			userName,
			comment: commentText,
			ipHash,
			isApproved: false,
			isSpam: false,
		};

		await this.db.insert(comments).values(newComment);

		return {
			success: true,
			message: 'Comment submitted successfully. It will be visible after moderation.',
		};
	}

	async getApprovedComments(softwareId: string): Promise<Comment[]> {
		return this.db
			.select()
			.from(comments)
			.where(and(eq(comments.softwareId, softwareId), eq(comments.isApproved, true)))
			.orderBy(desc(comments.createdAt));
	}

	async getAllComments(): Promise<Comment[]> {
		return this.db.select().from(comments).orderBy(desc(comments.createdAt));
	}

	async getPendingComments(): Promise<Comment[]> {
		return this.db
			.select()
			.from(comments)
			.where(and(eq(comments.isApproved, false), eq(comments.isSpam, false)))
			.orderBy(desc(comments.createdAt));
	}

	async approveComment(id: string, moderatorId: string): Promise<{ success: boolean }> {
		await this.db
			.update(comments)
			.set({
				isApproved: true,
				moderatedAt: new Date(),
				moderatedBy: moderatorId,
			})
			.where(eq(comments.id, id));

		return { success: true };
	}

	async rejectComment(id: string, moderatorId: string): Promise<{ success: boolean }> {
		await this.db
			.update(comments)
			.set({
				isSpam: true,
				moderatedAt: new Date(),
				moderatedBy: moderatorId,
			})
			.where(eq(comments.id, id));

		return { success: true };
	}

	async deleteComment(id: string): Promise<{ success: boolean }> {
		await this.db.delete(comments).where(eq(comments.id, id));
		return { success: true };
	}
}
