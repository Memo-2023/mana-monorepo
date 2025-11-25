/**
 * Document Service - Manage documents in document mode conversations
 */

import { createSupabaseBrowserClient } from './supabase';
import type { Document, DocumentWithConversation } from '@chat/types';

let supabase: ReturnType<typeof createSupabaseBrowserClient> | null = null;

function getSupabase() {
  if (!supabase) {
    supabase = createSupabaseBrowserClient();
  }
  return supabase;
}

export const documentService = {
  /**
   * Get all documents for a user (latest version of each)
   */
  async getUserDocuments(userId: string): Promise<DocumentWithConversation[]> {
    const sb = getSupabase();

    // Get all conversations with document_mode enabled
    const { data: conversations, error: convError } = await sb
      .from('conversations')
      .select('id, title, document_mode')
      .eq('user_id', userId)
      .eq('document_mode', true);

    if (convError) {
      console.error('Error loading conversations:', convError);
      return [];
    }

    if (!conversations || conversations.length === 0) {
      return [];
    }

    // For each conversation, load the latest document version
    const documents: DocumentWithConversation[] = [];

    for (const conv of conversations) {
      const { data: docData, error: docError } = await sb
        .from('documents')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (docError && docError.code !== 'PGRST116') {
        console.error(`Error loading document for conversation ${conv.id}:`, docError);
        continue;
      }

      if (docData) {
        documents.push({
          ...docData,
          conversation_title: conv.title || 'Unbenannte Konversation',
        });
      }
    }

    return documents;
  },

  /**
   * Get the latest document for a conversation
   */
  async getLatestDocument(conversationId: string): Promise<Document | null> {
    const sb = getSupabase();

    const { data, error } = await sb
      .from('documents')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('Error loading document:', error);
      }
      return null;
    }

    return data as Document;
  },

  /**
   * Create a new document
   */
  async createDocument(conversationId: string, content: string): Promise<Document | null> {
    const sb = getSupabase();

    const { data, error } = await sb
      .from('documents')
      .insert({
        conversation_id: conversationId,
        version: 1,
        content,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating document:', error);
      return null;
    }

    return data as Document;
  },

  /**
   * Create a new version of a document
   */
  async createDocumentVersion(conversationId: string, content: string): Promise<Document | null> {
    const sb = getSupabase();

    // Get the current highest version
    const { data: latestVersionData, error: versionError } = await sb
      .from('documents')
      .select('version')
      .eq('conversation_id', conversationId)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (versionError && versionError.code !== 'PGRST116') {
      console.error('Error loading latest document version:', versionError);
      return null;
    }

    const newVersion = (latestVersionData?.version || 0) + 1;

    // Create a new document version
    const { data, error } = await sb
      .from('documents')
      .insert({
        conversation_id: conversationId,
        version: newVersion,
        content,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating document version:', error);
      return null;
    }

    return data as Document;
  },

  /**
   * Get all versions of a document
   */
  async getAllDocumentVersions(conversationId: string): Promise<Document[]> {
    const sb = getSupabase();

    const { data, error } = await sb
      .from('documents')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('version', { ascending: false });

    if (error) {
      console.error('Error loading document versions:', error);
      return [];
    }

    return data as Document[];
  },
};
