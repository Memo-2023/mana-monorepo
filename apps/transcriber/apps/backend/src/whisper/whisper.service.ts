import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'child_process';
import * as fs from 'fs';
import OpenAI from 'openai';

export type WhisperProvider = 'groq' | 'local';
export type GroqWhisperModel = 'whisper-large-v3-turbo' | 'whisper-large-v3';
export type LocalWhisperModel = 'tiny' | 'base' | 'small' | 'medium' | 'large';
export type WhisperModel = GroqWhisperModel | LocalWhisperModel;

export interface TranscriptionResult {
  text: string;
  language: string;
  duration: number;
  provider: WhisperProvider;
}

export interface WhisperModelInfo {
  name: string;
  provider: WhisperProvider;
  speed: string;
  accuracy: string;
  cost?: string;
}

@Injectable()
export class WhisperService {
  private readonly logger = new Logger(WhisperService.name);
  private readonly groqClient: OpenAI | null;
  private readonly defaultProvider: WhisperProvider;
  private readonly defaultModel: WhisperModel;

  constructor(private configService: ConfigService) {
    const groqApiKey = this.configService.get<string>('GROQ_API_KEY');

    if (groqApiKey) {
      // Groq uses OpenAI-compatible API
      this.groqClient = new OpenAI({
        apiKey: groqApiKey,
        baseURL: 'https://api.groq.com/openai/v1',
      });
      this.logger.log('Groq API configured successfully');
    } else {
      this.groqClient = null;
      this.logger.warn(
        'Groq API key not configured. Only local Whisper available.',
      );
    }

    this.defaultProvider =
      (this.configService.get<string>('WHISPER_PROVIDER') as WhisperProvider) ||
      'groq';
    this.defaultModel =
      (this.configService.get<string>('WHISPER_MODEL') as WhisperModel) ||
      'whisper-large-v3-turbo';
  }

  async transcribe(
    audioPath: string,
    language: string = 'de',
    provider?: WhisperProvider,
    model?: WhisperModel,
  ): Promise<TranscriptionResult> {
    const selectedProvider = provider || this.defaultProvider;
    const selectedModel = model || this.defaultModel;

    // Fallback to local if Groq not available
    if (selectedProvider === 'groq' && !this.groqClient) {
      this.logger.warn('Groq not configured, falling back to local Whisper');
      return this.transcribeWithLocalWhisper(
        audioPath,
        language,
        selectedModel as LocalWhisperModel,
      );
    }

    if (selectedProvider === 'groq') {
      return this.transcribeWithGroq(
        audioPath,
        language,
        selectedModel as GroqWhisperModel,
      );
    }

    return this.transcribeWithLocalWhisper(
      audioPath,
      language,
      selectedModel as LocalWhisperModel,
    );
  }

  private async transcribeWithGroq(
    audioPath: string,
    language: string,
    model: GroqWhisperModel = 'whisper-large-v3-turbo',
  ): Promise<TranscriptionResult> {
    if (!this.groqClient) {
      throw new Error('Groq API not configured');
    }

    this.logger.log(
      `Transcribing with Groq Whisper API (${model}): ${audioPath}`,
    );

    const startTime = Date.now();

    const transcription = await this.groqClient.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: model,
      language,
      response_format: 'verbose_json',
    });

    const duration = (Date.now() - startTime) / 1000;

    this.logger.log(`Groq transcription completed in ${duration.toFixed(2)}s`);

    return {
      text: transcription.text,
      language: transcription.language || language,
      duration,
      provider: 'groq',
    };
  }

  private async transcribeWithLocalWhisper(
    audioPath: string,
    language: string,
    model: WhisperModel,
  ): Promise<TranscriptionResult> {
    this.logger.log(
      `Transcribing with local Whisper (model: ${model}): ${audioPath}`,
    );

    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      // Python script to run Whisper
      const pythonScript = `
import whisper
import json
import sys

model = whisper.load_model("${model}")
result = model.transcribe("${audioPath}", language="${language}")
print(json.dumps({"text": result["text"], "language": result.get("language", "${language}")}))
      `.trim();

      const python = spawn('python3', ['-c', pythonScript]);

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
        // Whisper outputs progress to stderr, log it
        this.logger.debug(data.toString());
      });

      python.on('close', (code) => {
        const duration = (Date.now() - startTime) / 1000;

        if (code !== 0) {
          this.logger.error(`Local Whisper error: ${stderr}`);
          reject(new Error(`Transcription failed: ${stderr}`));
          return;
        }

        try {
          const result = JSON.parse(stdout.trim());
          resolve({
            text: result.text,
            language: result.language,
            duration,
            provider: 'local',
          });
        } catch (e) {
          reject(new Error('Failed to parse transcription result'));
        }
      });
    });
  }

  getAvailableModels(): WhisperModelInfo[] {
    const models: WhisperModelInfo[] = [];

    // Groq models (cloud, ultra-fast)
    if (this.groqClient) {
      models.push(
        {
          name: 'whisper-large-v3-turbo',
          provider: 'groq',
          speed: '~300x realtime',
          accuracy: '95%',
          cost: '$0.04/hour',
        },
        {
          name: 'whisper-large-v3',
          provider: 'groq',
          speed: '~250x realtime',
          accuracy: '97%',
          cost: '$0.111/hour',
        },
      );
    }

    // Local models
    models.push(
      { name: 'tiny', provider: 'local', speed: '~10x realtime', accuracy: '75%' },
      { name: 'base', provider: 'local', speed: '~7x realtime', accuracy: '85%' },
      { name: 'small', provider: 'local', speed: '~4x realtime', accuracy: '91%' },
      { name: 'medium', provider: 'local', speed: '~2x realtime', accuracy: '94%' },
      { name: 'large', provider: 'local', speed: '~1x realtime', accuracy: '96-98%' },
    );

    return models;
  }

  isGroqAvailable(): boolean {
    return this.groqClient !== null;
  }

  getDefaultProvider(): WhisperProvider {
    return this.defaultProvider;
  }

  getDefaultModel(): WhisperModel {
    return this.defaultModel;
  }
}
