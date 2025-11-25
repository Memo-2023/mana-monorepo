import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  type AsyncResult,
  ok,
  err,
  ServiceError,
  DatabaseError,
  NotFoundError,
} from '@manacore/shared-errors';

export interface Conversation {
  id: string;
  user_id: string;
  model_id: string;
  title?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender: 'user' | 'assistant' | 'system';
  message_text: string;
  created_at: string;
}

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);
  private supabase: SupabaseClient | null = null;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    } else {
      this.logger.warn('Supabase configuration missing');
    }
  }

  async getConversations(userId: string): AsyncResult<Conversation[]> {
    if (!this.supabase) {
      return err(ServiceError.unavailable('Database'));
    }

    const { data, error } = await this.supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false });

    if (error) {
      this.logger.error('Error fetching conversations', error);
      return err(DatabaseError.queryFailed('Failed to fetch conversations'));
    }

    return ok(data || []);
  }

  async getConversation(id: string): AsyncResult<Conversation> {
    if (!this.supabase) {
      return err(ServiceError.unavailable('Database'));
    }

    const { data, error } = await this.supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      this.logger.error('Error fetching conversation', error);
      if (error.code === 'PGRST116') {
        return err(new NotFoundError('Conversation', id));
      }
      return err(DatabaseError.queryFailed('Failed to fetch conversation'));
    }

    return ok(data);
  }

  async getMessages(conversationId: string): AsyncResult<Message[]> {
    if (!this.supabase) {
      return err(ServiceError.unavailable('Database'));
    }

    const { data, error } = await this.supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error('Error fetching messages', error);
      return err(DatabaseError.queryFailed('Failed to fetch messages'));
    }

    return ok(data || []);
  }

  async createConversation(
    userId: string,
    modelId: string,
    title?: string,
  ): AsyncResult<Conversation> {
    if (!this.supabase) {
      return err(ServiceError.unavailable('Database'));
    }

    const { data, error } = await this.supabase
      .from('conversations')
      .insert({
        user_id: userId,
        model_id: modelId,
        title: title || 'Neue Unterhaltung',
        is_archived: false,
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Error creating conversation', error);
      return err(DatabaseError.queryFailed('Failed to create conversation'));
    }

    return ok(data);
  }

  async addMessage(
    conversationId: string,
    sender: 'user' | 'assistant' | 'system',
    messageText: string,
  ): AsyncResult<Message> {
    if (!this.supabase) {
      return err(ServiceError.unavailable('Database'));
    }

    const { data, error } = await this.supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender,
        message_text: messageText,
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Error adding message', error);
      return err(DatabaseError.queryFailed('Failed to add message'));
    }

    // Update conversation updated_at
    await this.supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return ok(data);
  }
}
