// Model type definition
export type Model = {
  id: string;
  name: string;
  description: string;
  parameters?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
};

// Message types
export type Message = {
  id: string;
  conversation_id: string;
  sender: 'user' | 'assistant' | 'system';
  message_text: string;
  created_at: string;
  updated_at: string;
};

// UI Message type used in components
export type UIMessage = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
};

// Conversation type
export type Conversation = {
  id: string; // UUID
  user_id: string; // UUID des Benutzers (auth.uid)
  model_id: string; // UUID
  template_id?: string; // UUID, optional
  conversation_mode: 'free' | 'guided' | 'template';
  created_at: string;
  updated_at: string;
};

// Type for API requests to OpenAI/Azure
export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

// API response type from OpenAI/Azure
export type ChatResponse = {
  id: string;
  choices: {
    content_filter_results?: any;
    finish_reason: string;
    index: number;
    logprobs: any;
    message?: {
      content: string;
      refusal?: any;
      role: string;
    };
  }[];
  created: number;
  model: string;
  object: string;
  prompt_filter_results?: any[];
  system_fingerprint?: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    completion_tokens_details?: any;
    prompt_tokens_details?: any;
  };
};