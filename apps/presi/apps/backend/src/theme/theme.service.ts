import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { themes } from '../db/schema';

@Injectable()
export class ThemeService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
  ) {}

  async findAll() {
    return this.db.select().from(themes);
  }

  async findOne(id: string) {
    const result = await this.db.select().from(themes).where(eq(themes.id, id));
    return result[0] || null;
  }

  async findDefault() {
    const result = await this.db
      .select()
      .from(themes)
      .where(eq(themes.isDefault, true));
    return result[0] || null;
  }
}
