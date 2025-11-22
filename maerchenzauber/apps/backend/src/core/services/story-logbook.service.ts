import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { promises as fsPromises } from 'fs';
import { SupabaseProvider } from '../../supabase/supabase.provider';

export interface LogEntry {
  timestamp: string;
  step: string;
  type: 'prompt' | 'response' | 'error' | 'info' | 'character' | 'illustration';
  data: any;
  duration?: number;
}

export interface StoryLogbook {
  storyId: string;
  userId: string;
  characterIds: string[]; // Changed to array to support multiple characters
  startTime: string;
  endTime?: string;
  totalDuration?: number;
  entries: LogEntry[];
  metadata: {
    storyTitle?: string;
    characters?: Array<{
      // Array of character info
      id: string;
      name: string;
      description?: string;
      isAnimal?: boolean;
      animalType?: string;
    }>;
    storyDescription?: string;
    language?: string;
    authorId?: string;
    illustratorId?: string;
    pageCount?: number;
    imageCount?: number;
    success: boolean;
    errors?: any[];
  };
}

@Injectable()
export class StoryLogbookService {
  private logbooks: Map<string, StoryLogbook> = new Map();
  private readonly logsDir = path.join(process.cwd(), 'logs', 'story-creation');
  private readonly isDevelopment: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseProvider: SupabaseProvider,
  ) {
    this.isDevelopment = this.configService.get('NODE_ENV') === 'development';

    // Only create logs directory in development
    if (this.isDevelopment) {
      this.ensureLogDirectory();
    }
  }

  private async ensureLogDirectory() {
    try {
      await fsPromises.mkdir(this.logsDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create logs directory:', error);
    }
  }

  /**
   * Start a new logbook for a story creation session
   */
  startLogbook(
    storyId: string,
    userId: string,
    characterIds: string | string[],
    metadata: Partial<StoryLogbook['metadata']> = {},
  ) {
    // Ensure characterIds is always an array
    const characterIdArray = Array.isArray(characterIds)
      ? characterIds
      : [characterIds];

    const logbook: StoryLogbook = {
      storyId,
      userId,
      characterIds: characterIdArray,
      startTime: new Date().toISOString(),
      entries: [],
      metadata: {
        success: false,
        ...metadata,
      },
    };

    this.logbooks.set(storyId, logbook);

    this.addEntry(storyId, {
      step: 'initialization',
      type: 'info',
      data: {
        message: 'Story creation started',
        storyId,
        userId,
        characterIds: characterIdArray,
        metadata,
      },
    });

    return logbook;
  }

  /**
   * Add an entry to the logbook
   */
  addEntry(storyId: string, entry: Omit<LogEntry, 'timestamp'>) {
    const logbook = this.logbooks.get(storyId);
    if (!logbook) {
      console.warn(`No logbook found for story ${storyId}`);
      return;
    }

    const logEntry: LogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    logbook.entries.push(logEntry);
  }

  /**
   * Log an AI prompt
   */
  logPrompt(storyId: string, step: string, prompt: any, service = 'unknown') {
    const startTime = Date.now();

    this.addEntry(storyId, {
      step: `${step}_prompt`,
      type: 'prompt',
      data: {
        service,
        prompt,
        timestamp: new Date().toISOString(),
      },
    });

    return startTime;
  }

  /**
   * Log an AI response
   */
  logResponse(
    storyId: string,
    step: string,
    response: any,
    startTime: number,
    service = 'unknown',
  ) {
    const duration = Date.now() - startTime;

    this.addEntry(storyId, {
      step: `${step}_response`,
      type: 'response',
      data: {
        service,
        response,
        timestamp: new Date().toISOString(),
      },
      duration,
    });
  }

  /**
   * Log an error
   */
  logError(storyId: string, step: string, error: any) {
    const logbook = this.logbooks.get(storyId);
    if (!logbook) return;

    this.addEntry(storyId, {
      step: `${step}_error`,
      type: 'error',
      data: {
        error:
          error instanceof Error
            ? {
                message: error.message,
                stack: error.stack,
                name: error.name,
              }
            : error,
        timestamp: new Date().toISOString(),
      },
    });

    // Add to metadata errors
    if (!logbook.metadata.errors) {
      logbook.metadata.errors = [];
    }
    logbook.metadata.errors.push({
      step,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log character information
   */
  logCharacter(storyId: string, characterData: any) {
    // Log the full character data for debugging
    this.addEntry(storyId, {
      step: 'character_data',
      type: 'character',
      data: {
        id: characterData.id,
        name: characterData.name,
        original_description: characterData.original_description,
        description: characterData.description,
        is_animal: characterData.is_animal,
        animal_type: characterData.animal_type,
        user_id: characterData.user_id,
        created_at: characterData.created_at,
      },
    });

    // Update metadata with character array
    const logbook = this.logbooks.get(storyId);
    if (logbook) {
      if (!logbook.metadata.characters) {
        logbook.metadata.characters = [];
      }

      // Add or update character in the array
      const existingIndex = logbook.metadata.characters.findIndex(
        (c) => c.id === characterData.id,
      );
      const characterInfo = {
        id: characterData.id,
        name: characterData.name,
        description:
          characterData.description || characterData.original_description,
        isAnimal: characterData.is_animal,
        animalType: characterData.animal_type,
      };

      if (existingIndex >= 0) {
        logbook.metadata.characters[existingIndex] = characterInfo;
      } else {
        logbook.metadata.characters.push(characterInfo);
      }

      // Also add to characterIds if not already present
      if (!logbook.characterIds.includes(characterData.id)) {
        logbook.characterIds.push(characterData.id);
      }
    }
  }

  /**
   * Log illustration prompt
   */
  logIllustration(
    storyId: string,
    page: number,
    prompt: string,
    imageUrl?: string,
  ) {
    this.addEntry(storyId, {
      step: `illustration_page_${page}`,
      type: 'illustration',
      data: {
        page,
        prompt,
        imageUrl,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Update metadata
   */
  updateMetadata(storyId: string, metadata: Partial<StoryLogbook['metadata']>) {
    const logbook = this.logbooks.get(storyId);
    if (!logbook) return;

    logbook.metadata = {
      ...logbook.metadata,
      ...metadata,
    };
  }

  /**
   * Finalize and save the logbook
   */
  async finalizeLogbook(storyId: string, success = true) {
    const logbook = this.logbooks.get(storyId);
    if (!logbook) {
      console.warn(`No logbook found for story ${storyId}`);
      return;
    }

    // Set end time and calculate duration
    logbook.endTime = new Date().toISOString();
    logbook.totalDuration =
      new Date(logbook.endTime).getTime() -
      new Date(logbook.startTime).getTime();
    logbook.metadata.success = success;

    // Add final entry
    this.addEntry(storyId, {
      step: 'finalization',
      type: 'info',
      data: {
        message: success
          ? 'Story creation completed successfully'
          : 'Story creation failed',
        totalDuration: logbook.totalDuration,
        totalEntries: logbook.entries.length,
        success,
      },
    });

    // @TODO NILS: REMOVE THIS LATER OR ADAPT OPTION TO OPT IN LOCALLY
    if (this.isDevelopment) {
      await this.saveLogbookToFile(logbook);
    }
    await this.saveLogbookToSupabase(logbook);

    // Clean up from memory
    this.logbooks.delete(storyId);

    return logbook;
  }

  /**
   * Save logbook to Supabase
   */
  private async saveLogbookToSupabase(logbook: StoryLogbook) {
    try {
      const summary = this.generateSummary(logbook);

      const { data, error } = await this.supabaseProvider
        .getClient()
        .from('story_logbooks')
        .insert({
          story_id: logbook.storyId,
          user_id: logbook.userId,
          character_ids: logbook.characterIds, // Now using array
          start_time: logbook.startTime,
          end_time: logbook.endTime,
          total_duration_ms: logbook.totalDuration,
          success: logbook.metadata.success,
          environment: this.configService.get('NODE_ENV') || 'production',
          entries: logbook.entries,
          metadata: logbook.metadata,
          summary,
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to save logbook to Supabase:', error);
        throw error;
      }

      console.log(`Story logbook saved to Supabase with ID: ${data.id}`);
      return data;
    } catch (error) {
      console.error('Failed to save logbook to Supabase:', error);

      throw error;
    }
  }

  /**
   * Save logbook to file (development only)
   */
  private async saveLogbookToFile(logbook: StoryLogbook) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `story_${logbook.storyId}_${timestamp}.json`;
      const filepath = path.join(this.logsDir, filename);

      // Create a summary file as well
      const summaryFilename = `story_${logbook.storyId}_${timestamp}_summary.md`;
      const summaryFilepath = path.join(this.logsDir, summaryFilename);

      // Save full JSON log
      await fsPromises.writeFile(
        filepath,
        JSON.stringify(logbook, null, 2),
        'utf-8',
      );

      // Generate and save markdown summary
      const summary = this.generateSummary(logbook);
      await fsPromises.writeFile(summaryFilepath, summary, 'utf-8');

      console.log(`Story logbook saved to: ${filepath}`);
      console.log(`Story summary saved to: ${summaryFilepath}`);

      return { logPath: filepath, summaryPath: summaryFilepath };
    } catch (error) {
      console.error('Failed to save logbook to file:', error);
      throw error;
    }
  }

  /**
   * Generate a human-readable summary
   */
  private generateSummary(logbook: StoryLogbook): string {
    const duration = logbook.totalDuration
      ? `${(logbook.totalDuration / 1000).toFixed(2)}s`
      : 'unknown';

    let summary = `# Story Creation Logbook Summary\n\n`;
    summary += `## Story Information\n`;
    summary += `- **Story ID**: ${logbook.storyId}\n`;
    summary += `- **User ID**: ${logbook.userId}\n`;
    summary += `- **Character IDs**: ${logbook.characterIds.join(', ')}\n`;
    summary += `- **Title**: ${logbook.metadata.storyTitle || 'Unknown'}\n`;
    summary += `- **Success**: ${
      logbook.metadata.success ? '✅ Yes' : '❌ No'
    }\n`;
    summary += `- **Total Duration**: ${duration}\n`;
    summary += `- **Start Time**: ${logbook.startTime}\n`;
    summary += `- **End Time**: ${logbook.endTime || 'Not completed'}\n\n`;

    summary += `## Character Information\n`;
    if (logbook.metadata.characters && logbook.metadata.characters.length > 0) {
      logbook.metadata.characters.forEach((char, index) => {
        summary += `### Character ${index + 1}: ${char.name}\n`;
        summary += `- **ID**: ${char.id}\n`;
        summary += `- **Description**: ${
          char.description || 'No description'
        }\n`;
        if (char.isAnimal) {
          summary += `- **Type**: ${char.animalType || 'Animal'}\n`;
        }
        summary += '\n';
      });
    } else {
      summary += `- No character information available\n\n`;
    }

    summary += `## Story Details\n`;
    summary += `- **Description**: ${
      logbook.metadata.storyDescription || 'No description'
    }\n`;
    summary += `- **Language**: ${logbook.metadata.language || 'Unknown'}\n`;
    summary += `- **Pages**: ${logbook.metadata.pageCount || 'Unknown'}\n`;
    summary += `- **Images**: ${logbook.metadata.imageCount || 'Unknown'}\n`;
    summary += `- **Author ID**: ${logbook.metadata.authorId || 'Unknown'}\n`;
    summary += `- **Illustrator ID**: ${
      logbook.metadata.illustratorId || 'Unknown'
    }\n\n`;

    // Process steps
    summary += `## Creation Steps\n\n`;
    const steps = this.extractSteps(logbook.entries);
    steps.forEach((step, index) => {
      summary += `### ${index + 1}. ${step.name}\n`;
      summary += `- **Time**: ${step.timestamp}\n`;
      summary += `- **Duration**: ${
        step.duration ? `${(step.duration / 1000).toFixed(2)}s` : 'N/A'
      }\n`;
      if (step.error) {
        summary += `- **Error**: ${step.error}\n`;
      }
      summary += '\n';
    });

    // Add errors section if any
    if (logbook.metadata.errors && logbook.metadata.errors.length > 0) {
      summary += `## Errors Encountered\n\n`;
      logbook.metadata.errors.forEach((error, index) => {
        summary += `${index + 1}. **${error.step}**: ${error.error}\n`;
        summary += `   - Time: ${error.timestamp}\n\n`;
      });
    }

    // Add prompts section (limit to first 3 for brevity in database)
    if (!this.isDevelopment) {
      const prompts = logbook.entries
        .filter((e) => e.type === 'prompt')
        .slice(0, 3);
      if (prompts.length > 0) {
        summary += `## Sample AI Prompts (First ${prompts.length})\n\n`;
        prompts.forEach((prompt, index) => {
          summary += `### Prompt ${index + 1}: ${prompt.step}\n`;
          summary += '```json\n';
          summary += JSON.stringify(prompt.data.prompt, null, 2).substring(
            0,
            500,
          );
          summary += '\n...\n```\n\n';
        });
      }
    } else {
      // In development, include all prompts
      const prompts = logbook.entries.filter((e) => e.type === 'prompt');
      summary += `## AI Prompts Used\n\n`;
      prompts.forEach((prompt, index) => {
        summary += `### Prompt ${index + 1}: ${prompt.step}\n`;
        summary += '```json\n';
        summary += JSON.stringify(prompt.data.prompt, null, 2);
        summary += '\n```\n\n';
      });
    }

    return summary;
  }

  /**
   * Extract unique steps from entries
   */
  private extractSteps(entries: LogEntry[]) {
    const stepMap = new Map<string, any>();

    entries.forEach((entry) => {
      const baseStep = entry.step.replace(/_prompt$|_response$|_error$/, '');

      if (!stepMap.has(baseStep)) {
        stepMap.set(baseStep, {
          name: baseStep.replace(/_/g, ' ').toUpperCase(),
          timestamp: entry.timestamp,
          duration: 0,
          error: null,
        });
      }

      const step = stepMap.get(baseStep);
      if (entry.duration) {
        step.duration += entry.duration;
      }
      if (entry.type === 'error') {
        step.error = entry.data.error?.message || 'Unknown error';
      }
    });

    return Array.from(stepMap.values());
  }

  /**
   * Get current logbook (for debugging)
   */
  getLogbook(storyId: string): StoryLogbook | undefined {
    return this.logbooks.get(storyId);
  }

  /**
   * Retrieve logbook from Supabase
   */
  async getLogbookFromSupabase(storyId: string, userId: string) {
    try {
      const { data, error } = await this.supabaseProvider
        .getClient()
        .from('story_logbooks')
        .select('*')
        .eq('story_id', storyId)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Failed to retrieve logbook from Supabase:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to retrieve logbook:', error);
      return null;
    }
  }
}
