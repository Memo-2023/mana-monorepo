import { Injectable, Inject, Logger } from '@nestjs/common';
import { DATABASE_TOKEN, type Database } from '../database.module';
import {
  studySessions,
  type StudySession,
  type NewStudySession,
  eq,
  and,
  desc,
  gte,
  lte,
  sql,
} from '@manacore/manadeck-database';

@Injectable()
export class StudySessionRepository {
  private readonly logger = new Logger(StudySessionRepository.name);

  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async findByUserId(userId: string, limit = 50): Promise<StudySession[]> {
    this.logger.debug(`Finding study sessions for user: ${userId}`);
    return this.db
      .select()
      .from(studySessions)
      .where(eq(studySessions.userId, userId))
      .orderBy(desc(studySessions.startedAt))
      .limit(limit);
  }

  async findByDeckId(deckId: string, userId: string): Promise<StudySession[]> {
    return this.db
      .select()
      .from(studySessions)
      .where(and(eq(studySessions.deckId, deckId), eq(studySessions.userId, userId)))
      .orderBy(desc(studySessions.startedAt));
  }

  async findByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<StudySession[]> {
    return this.db
      .select()
      .from(studySessions)
      .where(
        and(
          eq(studySessions.userId, userId),
          gte(studySessions.startedAt, startDate),
          lte(studySessions.startedAt, endDate)
        )
      )
      .orderBy(desc(studySessions.startedAt));
  }

  async findById(id: string): Promise<StudySession | null> {
    const result = await this.db
      .select()
      .from(studySessions)
      .where(eq(studySessions.id, id))
      .limit(1);
    return result[0] || null;
  }

  async create(data: NewStudySession): Promise<StudySession> {
    this.logger.debug(`Creating study session for deck: ${data.deckId}`);
    const result = await this.db.insert(studySessions).values(data).returning();
    return result[0];
  }

  async update(
    id: string,
    userId: string,
    data: Partial<Omit<NewStudySession, 'id' | 'userId' | 'deckId' | 'startedAt'>>
  ): Promise<StudySession | null> {
    this.logger.debug(`Updating study session: ${id}`);
    const result = await this.db
      .update(studySessions)
      .set(data)
      .where(and(eq(studySessions.id, id), eq(studySessions.userId, userId)))
      .returning();
    return result[0] || null;
  }

  async getStatsByUserId(userId: string) {
    const result = await this.db
      .select({
        totalSessions: sql<number>`count(*)::int`,
        totalCardsStudied: sql<number>`sum(${studySessions.completedCards})::int`,
        totalCorrectCards: sql<number>`sum(${studySessions.correctCards})::int`,
        totalTimeSeconds: sql<number>`sum(${studySessions.timeSpentSeconds})::int`,
      })
      .from(studySessions)
      .where(eq(studySessions.userId, userId));
    return result[0];
  }
}
