/**
 * Conversation Service - CRUD operations via Supabase
 */

import { createSupabaseBrowserClient } from './supabase';
import { chatService } from './chat';
import type { Conversation, Message, ChatMessage } from '@chat/types';

let supabase: ReturnType<typeof createSupabaseBrowserClient> | null = null;

function getSupabase() {
  if (!supabase) {
    supabase = createSupabaseBrowserClient();
  }
  return supabase;
}

export const conversationService = {
  /**
   * Create a new conversation
   */
  async createConversation(
    userId: string,
    modelId: string,
    mode: 'free' | 'guided' | 'template' = 'free',
    templateId?: string,
    documentMode: boolean = false,
    spaceId?: string
  ): Promise<string | null> {
    const sb = getSupabase();

    const { data, error } = await sb
      .from('conversations')
      .insert({
        user_id: userId,
        model_id: modelId,
        template_id: templateId,
        conversation_mode: mode,
        document_mode: documentMode,
        space_id: spaceId,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }

    return data.id;
  },

  /**
   * Get all active conversations for a user
   */
  async getConversations(userId: string, spaceId?: string): Promise<Conversation[]> {
    const sb = getSupabase();

    let query = sb
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false);

    if (spaceId) {
      query = query.eq('space_id', spaceId);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading conversations:', error);
      return [];
    }

    return data as Conversation[];
  },

  /**
   * Get archived conversations
   */
  async getArchivedConversations(userId: string): Promise<Conversation[]> {
    const sb = getSupabase();

    const { data, error } = await sb
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', true)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading archived conversations:', error);
      return [];
    }

    return data as Conversation[];
  },

  /**
   * Get a single conversation
   */
  async getConversation(conversationId: string): Promise<Conversation | null> {
    const sb = getSupabase();

    const { data, error } = await sb
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error) {
      console.error('Error loading conversation:', error);
      return null;
    }

    return data as Conversation;
  },

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string): Promise<Message[]> {
    const sb = getSupabase();

    const { data, error } = await sb
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return [];
    }

    return data as Message[];
  },

  /**
   * Add a message to a conversation
   */
  async addMessage(
    conversationId: string,
    sender: 'user' | 'assistant' | 'system',
    messageText: string
  ): Promise<string | null> {
    const sb = getSupabase();

    const { data, error } = await sb
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender,
        message_text: messageText,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error adding message:', error);
      return null;
    }

    return data.id;
  },

  /**
   * Update conversation title
   */
  async updateTitle(conversationId: string, title: string): Promise<boolean> {
    const sb = getSupabase();

    const { error } = await sb
      .from('conversations')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (error) {
      console.error('Error updating title:', error);
      return false;
    }

    return true;
  },

  /**
   * Archive a conversation
   */
  async archiveConversation(conversationId: string): Promise<boolean> {
    const sb = getSupabase();

    const { error } = await sb
      .from('conversations')
      .update({ is_archived: true })
      .eq('id', conversationId);

    if (error) {
      console.error('Error archiving conversation:', error);
      return false;
    }

    return true;
  },

  /**
   * Unarchive a conversation
   */
  async unarchiveConversation(conversationId: string): Promise<boolean> {
    const sb = getSupabase();

    const { error } = await sb
      .from('conversations')
      .update({ is_archived: false })
      .eq('id', conversationId);

    if (error) {
      console.error('Error unarchiving conversation:', error);
      return false;
    }

    return true;
  },

  /**
   * Delete a conversation permanently
   */
  async deleteConversation(conversationId: string): Promise<boolean> {
    const sb = getSupabase();

    // Delete messages first
    const { error: messagesError } = await sb
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId);

    if (messagesError) {
      console.error('Error deleting messages:', messagesError);
      return false;
    }

    // Delete conversation
    const { error: conversationError } = await sb
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (conversationError) {
      console.error('Error deleting conversation:', conversationError);
      return false;
    }

    return true;
  },

  /**
   * Send a message and get AI response
   */
  async sendMessageAndGetResponse(
    conversationId: string,
    userMessage: string,
    modelId: string
  ): Promise<{
    userMessageId: string | null;
    assistantMessageId: string | null;
    assistantResponse: string;
    title?: string;
  }> {
    // Add user message
    const userMessageId = await this.addMessage(conversationId, 'user', userMessage);

    // Load all messages for context
    const messages = await this.getMessages(conversationId);

    // Build chat messages for API
    const chatMessages: ChatMessage[] = messages.map((m) => ({
      role: m.sender === 'user' ? 'user' : m.sender === 'assistant' ? 'assistant' : 'system',
      content: m.message_text,
    }));

    // Get AI response
    const response = await chatService.createCompletion({
      messages: chatMessages,
      modelId,
    });

    if (!response) {
      return {
        userMessageId,
        assistantMessageId: null,
        assistantResponse: 'Fehler beim Abrufen der Antwort.',
      };
    }

    // Save assistant message
    const assistantMessageId = await this.addMessage(conversationId, 'assistant', response.content);

    // Update conversation timestamp
    const sb = getSupabase();
    await sb
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    // Generate title if this is a new conversation (first or second message)
    let title: string | undefined;
    if (messages.length <= 2) {
      title = await this.generateTitle(userMessage);
      if (title) {
        await this.updateTitle(conversationId, title);
      }
    }

    return {
      userMessageId,
      assistantMessageId,
      assistantResponse: response.content,
      title,
    };
  },

  /**
   * Generate a conversation title based on user message
   */
  async generateTitle(userMessage: string): Promise<string> {
    const titlePrompt = `Schreibe eine kurze, prägnante Überschrift (maximal 5 Wörter) für diesen Chat: "${userMessage}"`;

    const response = await chatService.createCompletion({
      messages: [{ role: 'user', content: titlePrompt }],
      modelId: '550e8400-e29b-41d4-a716-446655440004', // GPT-4o-Mini
      temperature: 0.3,
      maxTokens: 50,
    });

    if (!response) {
      return 'Neue Konversation';
    }

    // Clean up title
    let title = response.content
      .trim()
      .replace(/^["']|["']$/g, '')
      .replace(/\.$/g, '');

    if (title.length > 100) {
      title = title.substring(0, 97) + '...';
    }

    return title;
  },
};
