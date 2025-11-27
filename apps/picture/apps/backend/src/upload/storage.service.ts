import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private supabase: SupabaseClient | null = null;
  private readonly bucket = 'user-uploads';

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    } else {
      this.logger.warn('Supabase credentials not configured');
    }
  }

  async uploadFile(
    buffer: Buffer,
    userId: string,
    filename: string,
    contentType: string,
  ): Promise<{ storagePath: string; publicUrl: string }> {
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 10);
    const ext = filename.split('.').pop() || 'jpg';
    const storagePath = `${userId}/${timestamp}-${randomId}.${ext}`;

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(storagePath, buffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      this.logger.error('Error uploading file to storage', error);
      throw error;
    }

    const { data: urlData } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(storagePath);

    return {
      storagePath,
      publicUrl: urlData.publicUrl,
    };
  }

  async uploadFromUrl(
    url: string,
    userId: string,
    filename: string,
  ): Promise<{ storagePath: string; publicUrl: string }> {
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    // Download the file
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download file from ${url}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    return this.uploadFile(buffer, userId, filename, contentType);
  }

  async deleteFile(storagePath: string): Promise<void> {
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .remove([storagePath]);

    if (error) {
      this.logger.error(`Error deleting file ${storagePath}`, error);
      throw error;
    }
  }

  async uploadBoardThumbnail(
    boardId: string,
    dataUrl: string,
  ): Promise<string> {
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const filename = `boards/${boardId}/thumbnail-${Date.now()}.png`;

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(filename, buffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (error) {
      this.logger.error('Error uploading board thumbnail', error);
      throw error;
    }

    const { data: urlData } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(filename);

    return urlData.publicUrl;
  }
}
