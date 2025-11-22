import { Injectable, Logger } from '@nestjs/common';
import {
  PipelineStep,
  PipelineContext,
  PipelineResult,
  ExecutionLog,
} from './pipeline.types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PipelineExecutor {
  private readonly logger = new Logger(PipelineExecutor.name);

  async execute<T>(
    steps: PipelineStep[],
    initialInput: any,
    userId?: string,
  ): Promise<PipelineResult<T>> {
    const context: PipelineContext = {
      userId,
      requestId: uuidv4(),
      startTime: new Date(),
      metadata: {},
      logs: [],
    };

    const pipelineStartTime = Date.now();
    let currentData = initialInput;
    const executedSteps: PipelineStep[] = [];

    try {
      for (const step of steps) {
        const log = await this.executeStep(step, currentData, context);
        context.logs.push(log);

        if (log.status === 'failed') {
          throw new Error(log.error);
        }

        currentData = log.output;
        executedSteps.push(step);
      }

      const totalDuration = Date.now() - pipelineStartTime;

      return {
        success: true,
        data: currentData,
        executionLogs: context.logs,
        totalDuration,
        context,
      };
    } catch (error) {
      this.logger.error(
        `Pipeline failed at step: ${executedSteps.length}`,
        error,
      );

      // Execute rollbacks in reverse order
      await this.executeRollbacks(
        executedSteps.reverse(),
        currentData,
        error as Error,
        context,
      );

      const totalDuration = Date.now() - pipelineStartTime;

      return {
        success: false,
        error: error as Error,
        executionLogs: context.logs,
        totalDuration,
        context,
      };
    }
  }

  async executeStep(
    step: PipelineStep,
    input: any,
    context: PipelineContext,
  ): Promise<ExecutionLog> {
    const startTime = new Date();
    const log: ExecutionLog = {
      stepName: step.name,
      startTime,
      input: this.sanitizeForLogging(input),
      status: 'running',
    };

    try {
      // Validation
      if (step.validate) {
        const validation = step.validate(input);
        if (!validation.valid) {
          throw new Error(
            `Validation failed: ${validation.errors?.join(', ')}`,
          );
        }
      }

      // Execute with timeout if specified
      let output;
      if (step.timeout) {
        output = await this.executeWithTimeout(
          step.execute(input, context),
          step.timeout,
        );
      } else {
        output = await step.execute(input, context);
      }

      const endTime = new Date();
      log.endTime = endTime;
      log.duration = endTime.getTime() - startTime.getTime();
      log.output = this.sanitizeForLogging(output);
      log.status = 'success';

      this.logger.log(`✓ ${step.name} completed in ${log.duration}ms`);

      return log;
    } catch (error) {
      const endTime = new Date();
      log.endTime = endTime;
      log.duration = endTime.getTime() - startTime.getTime();
      log.error = (error as Error).message;
      log.status = 'failed';

      this.logger.error(`✗ ${step.name} failed after ${log.duration}ms`, error);

      // Retry logic if enabled
      if (step.retryable && step.maxRetries) {
        return this.retryStep(step, input, context, step.maxRetries);
      }

      return log;
    }
  }

  private async retryStep(
    step: PipelineStep,
    input: any,
    context: PipelineContext,
    maxRetries: number,
  ): Promise<ExecutionLog> {
    let lastLog: ExecutionLog | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      this.logger.log(
        `Retry attempt ${attempt}/${maxRetries} for step: ${step.name}`,
      );

      // Exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000),
      );

      lastLog = await this.executeStep(step, input, context);

      if (lastLog.status === 'success') {
        return lastLog;
      }
    }

    return lastLog!;
  }

  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    const timeout = new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Operation timed out after ${timeoutMs}ms`)),
        timeoutMs,
      ),
    );

    return Promise.race([promise, timeout]);
  }

  private async executeRollbacks(
    steps: PipelineStep[],
    lastInput: any,
    error: Error,
    context: PipelineContext,
  ): Promise<void> {
    for (const step of steps) {
      if (step.rollback) {
        try {
          this.logger.log(`Rolling back: ${step.name}`);
          await step.rollback(lastInput, error, context);
        } catch (rollbackError) {
          this.logger.error(`Rollback failed for ${step.name}`, rollbackError);
        }
      }
    }
  }

  private sanitizeForLogging(data: any): any {
    // Remove sensitive data from logs
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'apiKey'];

    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized = { ...data };

    for (const key of Object.keys(sanitized)) {
      if (
        sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))
      ) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeForLogging(sanitized[key]);
      }
    }

    return sanitized;
  }
}
