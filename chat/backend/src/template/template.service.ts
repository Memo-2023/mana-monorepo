import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq, and, asc } from 'drizzle-orm';
import {
  type AsyncResult,
  ok,
  err,
  DatabaseError,
  NotFoundError,
} from '@manacore/shared-errors';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import {
  templates,
  type Template,
  type NewTemplate,
} from '../db/schema/templates.schema';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
  ) {}

  async getTemplates(userId: string): AsyncResult<Template[]> {
    try {
      const result = await this.db
        .select()
        .from(templates)
        .where(eq(templates.userId, userId))
        .orderBy(asc(templates.name));

      return ok(result);
    } catch (error) {
      this.logger.error('Error fetching templates', error);
      return err(DatabaseError.queryFailed('Failed to fetch templates'));
    }
  }

  async getTemplate(id: string, userId: string): AsyncResult<Template> {
    try {
      const result = await this.db
        .select()
        .from(templates)
        .where(and(eq(templates.id, id), eq(templates.userId, userId)))
        .limit(1);

      if (result.length === 0) {
        return err(new NotFoundError('Template', id));
      }

      return ok(result[0]);
    } catch (error) {
      this.logger.error('Error fetching template', error);
      return err(DatabaseError.queryFailed('Failed to fetch template'));
    }
  }

  async getDefaultTemplate(userId: string): AsyncResult<Template | null> {
    try {
      const result = await this.db
        .select()
        .from(templates)
        .where(
          and(eq(templates.userId, userId), eq(templates.isDefault, true)),
        )
        .limit(1);

      return ok(result.length > 0 ? result[0] : null);
    } catch (error) {
      this.logger.error('Error fetching default template', error);
      return err(DatabaseError.queryFailed('Failed to fetch default template'));
    }
  }

  async createTemplate(
    userId: string,
    data: {
      name: string;
      description?: string;
      systemPrompt: string;
      initialQuestion?: string;
      modelId?: string;
      color?: string;
      documentMode?: boolean;
    },
  ): AsyncResult<Template> {
    try {
      const newTemplate: NewTemplate = {
        userId,
        name: data.name,
        description: data.description,
        systemPrompt: data.systemPrompt,
        initialQuestion: data.initialQuestion,
        modelId: data.modelId,
        color: data.color || '#3b82f6',
        documentMode: data.documentMode || false,
        isDefault: false,
      };

      const result = await this.db
        .insert(templates)
        .values(newTemplate)
        .returning();

      return ok(result[0]);
    } catch (error) {
      this.logger.error('Error creating template', error);
      return err(DatabaseError.queryFailed('Failed to create template'));
    }
  }

  async updateTemplate(
    id: string,
    userId: string,
    data: Partial<{
      name: string;
      description: string;
      systemPrompt: string;
      initialQuestion: string;
      modelId: string;
      color: string;
      documentMode: boolean;
    }>,
  ): AsyncResult<Template> {
    try {
      // First verify the template belongs to the user
      const templateResult = await this.getTemplate(id, userId);
      if (!templateResult.ok) {
        return err(templateResult.error);
      }

      const result = await this.db
        .update(templates)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(templates.id, id))
        .returning();

      return ok(result[0]);
    } catch (error) {
      this.logger.error('Error updating template', error);
      return err(DatabaseError.queryFailed('Failed to update template'));
    }
  }

  async setDefaultTemplate(id: string, userId: string): AsyncResult<Template> {
    try {
      // First verify the template belongs to the user
      const templateResult = await this.getTemplate(id, userId);
      if (!templateResult.ok) {
        return err(templateResult.error);
      }

      // Clear all default flags for this user
      await this.db
        .update(templates)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(templates.userId, userId));

      // Set the new default
      const result = await this.db
        .update(templates)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(eq(templates.id, id))
        .returning();

      return ok(result[0]);
    } catch (error) {
      this.logger.error('Error setting default template', error);
      return err(DatabaseError.queryFailed('Failed to set default template'));
    }
  }

  async deleteTemplate(id: string, userId: string): AsyncResult<void> {
    try {
      // First verify the template belongs to the user
      const templateResult = await this.getTemplate(id, userId);
      if (!templateResult.ok) {
        return err(templateResult.error);
      }

      await this.db.delete(templates).where(eq(templates.id, id));

      return ok(undefined);
    } catch (error) {
      this.logger.error('Error deleting template', error);
      return err(DatabaseError.queryFailed('Failed to delete template'));
    }
  }
}
