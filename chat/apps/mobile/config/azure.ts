/**
 * Model Configuration
 * Note: API keys are now stored securely in the backend
 * This file only contains model definitions for the mobile app UI
 */

// Available models for the chat application
// These match the models configured in the backend
export const availableModels = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'GPT-O3-Mini',
    description: 'Azure OpenAI O3-Mini: Effizientes Modell für schnelle Antworten.',
    parameters: {
      temperature: 0.7,
      max_tokens: 800,
      provider: 'azure',
      deployment: 'gpt-o3-mini-se',
    }
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'GPT-4o-Mini',
    description: 'Azure OpenAI GPT-4o-Mini: Kompaktes, leistungsstarkes KI-Modell.',
    parameters: {
      temperature: 0.7,
      max_tokens: 1000,
      provider: 'azure',
      deployment: 'gpt-4o-mini-se',
    }
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    name: 'GPT-4o',
    description: 'Azure OpenAI GPT-4o: Das fortschrittlichste multimodale KI-Modell.',
    parameters: {
      temperature: 0.7,
      max_tokens: 1200,
      provider: 'azure',
      deployment: 'gpt-4o-se',
    }
  }
];

// Helper function to get model by ID
export function getModelById(modelId: string) {
  return availableModels.find(m => m.id === modelId);
}

// Helper function to get model by deployment name
export function getModelByDeployment(deployment: string) {
  return availableModels.find(m => m.parameters.deployment === deployment);
}

// Default model
export const defaultModel = availableModels[0];
