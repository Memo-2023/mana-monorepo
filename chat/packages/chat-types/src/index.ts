/**
 * Chat Types - Shared type definitions for the Chat application
 */

// Message Types
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender: 'user' | 'assistant' | 'system';
  message_text: string;
  created_at: string;
  updated_at?: string;
}

// Conversation Types
export interface Conversation {
  id: string;
  user_id: string;
  model_id: string;
  template_id?: string;
  conversation_mode: 'free' | 'guided' | 'template';
  document_mode: boolean;
  title?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

// AI Model Types
export interface AIModelParameters {
  temperature: number;
  max_tokens: number;
  provider: 'azure' | 'openai';
  deployment: string;
  endpoint: string;
  api_version: string;
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  parameters: AIModelParameters;
}

// Token Usage Types
export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

// API Response Types
export interface ChatCompletionResponse {
  content: string;
  usage: TokenUsage;
}

// Template Types
export interface Template {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  created_at: string;
  updated_at: string;
}

// Space Types
export interface Space {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

// Document Types
export interface Document {
  id: string;
  conversation_id: string;
  title: string;
  content: string;
  version: number;
  created_at: string;
  updated_at: string;
}
