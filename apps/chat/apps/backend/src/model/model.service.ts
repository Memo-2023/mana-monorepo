import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq, asc } from 'drizzle-orm';
import {
  type AsyncResult,
  ok,
  err,
  DatabaseError,
  NotFoundError,
} from '@manacore/shared-errors';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { models, type Model } from '../db/schema/models.schema';

@Injectable()
export class ModelService {
  private readonly logger = new Logger(ModelService.name);

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
  ) {}

  async getModels(): AsyncResult<Model[]> {
    try {
      const result = await this.db
        .select()
        .from(models)
        .where(eq(models.isActive, true))
        .orderBy(asc(models.name));

      return ok(result);
    } catch (error) {
      this.logger.error('Error fetching models', error);
      return err(DatabaseError.queryFailed('Failed to fetch models'));
    }
  }

  async getModel(id: string): AsyncResult<Model> {
    try {
      const result = await this.db
        .select()
        .from(models)
        .where(eq(models.id, id))
        .limit(1);

      if (result.length === 0) {
        return err(new NotFoundError('Model', id));
      }

      return ok(result[0]);
    } catch (error) {
      this.logger.error('Error fetching model', error);
      return err(DatabaseError.queryFailed('Failed to fetch model'));
    }
  }
}
