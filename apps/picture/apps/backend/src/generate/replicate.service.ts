import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Replicate from 'replicate';

export interface PredictionInput {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  num_inference_steps?: number;
  guidance_scale?: number;
  seed?: number;
  image?: string; // For img2img
  prompt_strength?: number;
}

export interface Prediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string[] | string;
  error?: string;
  metrics?: {
    predict_time?: number;
  };
}

@Injectable()
export class ReplicateService {
  private readonly logger = new Logger(ReplicateService.name);
  private replicate: Replicate | null = null;

  constructor(private configService: ConfigService) {
    const apiToken = this.configService.get<string>('REPLICATE_API_TOKEN');
    if (apiToken) {
      this.replicate = new Replicate({ auth: apiToken });
    } else {
      this.logger.warn('REPLICATE_API_TOKEN not configured');
    }
  }

  async createPrediction(
    modelId: string,
    version: string,
    input: PredictionInput,
    webhookUrl?: string,
  ): Promise<Prediction> {
    if (!this.replicate) {
      throw new Error('Replicate not configured');
    }

    try {
      const prediction = await this.replicate.predictions.create({
        version,
        input,
        webhook: webhookUrl,
        webhook_events_filter: ['completed'],
      });

      return {
        id: prediction.id,
        status: prediction.status as Prediction['status'],
        output: prediction.output as string[] | string | undefined,
        error: prediction.error as string | undefined,
      };
    } catch (error) {
      this.logger.error('Error creating prediction', error);
      throw error;
    }
  }

  async getPrediction(predictionId: string): Promise<Prediction> {
    if (!this.replicate) {
      throw new Error('Replicate not configured');
    }

    try {
      const prediction = await this.replicate.predictions.get(predictionId);

      return {
        id: prediction.id,
        status: prediction.status as Prediction['status'],
        output: prediction.output as string[] | string | undefined,
        error: prediction.error as string | undefined,
        metrics: prediction.metrics as Prediction['metrics'],
      };
    } catch (error) {
      this.logger.error(`Error getting prediction ${predictionId}`, error);
      throw error;
    }
  }

  async cancelPrediction(predictionId: string): Promise<void> {
    if (!this.replicate) {
      throw new Error('Replicate not configured');
    }

    try {
      await this.replicate.predictions.cancel(predictionId);
    } catch (error) {
      this.logger.error(`Error canceling prediction ${predictionId}`, error);
      throw error;
    }
  }

  async waitForPrediction(
    predictionId: string,
    timeoutMs: number = 300000, // 5 minutes
    pollIntervalMs: number = 2000,
  ): Promise<Prediction> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const prediction = await this.getPrediction(predictionId);

      if (prediction.status === 'succeeded' || prediction.status === 'failed' || prediction.status === 'canceled') {
        return prediction;
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error('Prediction timed out');
  }
}
