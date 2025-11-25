import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    } else {
      this.logger.warn('Supabase configuration missing');
    }
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    if (!this.supabase) {
      this.logger.warn('Supabase not configured');
      return [];
    }

    const { data, error } = await this.supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false });

    if (error) {
      this.logger.error('Error fetching conversations', error);
      throw error;
    }

    return data || [];
  }

  async getConversation(id: string): Promise<Conversation | null> {
    if (!this.supabase) {
      return null;
    }

    const { data, error } = await this.supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      this.logger.error('Error fetching conversation', error);
      return null;
    }

    return data;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    if (!this.supabase) {
      return [];
    }

    const { data, error } = await this.supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error('Error fetching messages', error);
      throw error;
    }

    return data || [];
  }

  async createConversation(
    userId: string,
    modelId: string,
    title?: string,
  ): Promise<Conversation> {
    if (!this.supabase) {
      throw new Error('Supabase not configured');
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
      throw error;
    }

    return data;
  }

  async addMessage(
    conversationId: string,
    sender: 'user' | 'assistant' | 'system',
    messageText: string,
  ): Promise<Message> {
    if (!this.supabase) {
      throw new Error('Supabase not configured');
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
      throw error;
    }

    // Update conversation updated_at
    await this.supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return data;
  }
}
