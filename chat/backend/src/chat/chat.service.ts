import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatCompletionDto, ChatCompletionResponseDto } from './dto/chat-completion.dto';

export interface AIModel {
  id: string;
  name: string;
  description: string;
  parameters: {
    temperature: number;
    max_tokens: number;
    provider: string;
    deployment: string;
    endpoint: string;
    api_version: string;
  };
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly apiKey: string;
  private readonly endpoint: string;
  private readonly apiVersion: string;

  // Available models configuration
  private readonly availableModels: AIModel[] = [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'GPT-O3-Mini',
      description: 'Azure OpenAI O3-Mini: Effizientes Modell für schnelle Antworten.',
      parameters: {
        temperature: 0.7,
        max_tokens: 800,
        provider: 'azure',
        deployment: 'gpt-o3-mini-se',
        endpoint: 'https://memoroseopenai.openai.azure.com',
        api_version: '2024-12-01-preview',
      },
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
        endpoint: 'https://memoroseopenai.openai.azure.com',
        api_version: '2024-12-01-preview',
      },
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
        endpoint: 'https://memoroseopenai.openai.azure.com',
        api_version: '2024-12-01-preview',
      },
    },
  ];

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('AZURE_OPENAI_API_KEY') || '';
    this.endpoint = this.configService.get<string>('AZURE_OPENAI_ENDPOINT') || 'https://memoroseopenai.openai.azure.com';
    this.apiVersion = this.configService.get<string>('AZURE_OPENAI_API_VERSION') || '2024-12-01-preview';

    if (!this.apiKey) {
      this.logger.warn('AZURE_OPENAI_API_KEY is not set!');
    }
  }

  getAvailableModels(): AIModel[] {
    return this.availableModels;
  }

  getModelById(modelId: string): AIModel | undefined {
    return this.availableModels.find((m) => m.id === modelId);
  }

  async createCompletion(dto: ChatCompletionDto): Promise<ChatCompletionResponseDto> {
    const model = this.getModelById(dto.modelId);

    if (!model) {
      throw new BadRequestException(`Model with ID ${dto.modelId} not found`);
    }

    const deployment = model.parameters.deployment;
    const temperature = dto.temperature ?? model.parameters.temperature;
    const maxTokens = dto.maxTokens ?? model.parameters.max_tokens;

    // Prepare request body
    const requestBody: Record<string, unknown> = {
      messages: dto.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    };

    // Model-specific parameters
    const isGPTOModel = deployment.includes('gpt-o') || deployment.includes('gpt-4o');

    if (!isGPTOModel) {
      requestBody.max_tokens = maxTokens;
      requestBody.temperature = temperature;
    }

    const url = `${this.endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${this.apiVersion}`;

    this.logger.log(`Sending request to: ${url}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`API error: ${response.status} - ${errorText}`);
        throw new BadRequestException(`Azure OpenAI API error: ${response.status}`);
      }

      const data = await response.json();

      const messageContent = data.choices?.[0]?.message?.content;

      if (!messageContent) {
        this.logger.warn('No message content in response');
        throw new BadRequestException('No response generated');
      }

      return {
        content: messageContent,
        usage: {
          prompt_tokens: data.usage?.prompt_tokens || 0,
          completion_tokens: data.usage?.completion_tokens || 0,
          total_tokens: data.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      this.logger.error('Error calling Azure OpenAI API', error);
      throw error;
    }
  }
}
