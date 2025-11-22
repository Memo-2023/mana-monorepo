import { Injectable } from '@nestjs/common';
import { PipelineStep } from './pipeline.types';

@Injectable()
export class PipelineRegistry {
  private steps = new Map<string, PipelineStep>();
  private pipelines = new Map<string, PipelineStep[]>();

  registerStep(step: PipelineStep): void {
    const key = `${step.category}:${step.name}`;
    this.steps.set(key, step);
  }

  registerPipeline(name: string, steps: PipelineStep[]): void {
    this.pipelines.set(name, steps);
  }

  getStep(category: string, name: string): PipelineStep | undefined {
    return this.steps.get(`${category}:${name}`);
  }

  getPipeline(name: string): PipelineStep[] | undefined {
    return this.pipelines.get(name);
  }

  getAllSteps(): Map<string, PipelineStep> {
    return this.steps;
  }

  getAllPipelines(): Map<string, PipelineStep[]> {
    return this.pipelines;
  }

  getStepsByCategory(category: string): PipelineStep[] {
    const categorySteps: PipelineStep[] = [];

    this.steps.forEach((step, key) => {
      if (key.startsWith(`${category}:`)) {
        categorySteps.push(step);
      }
    });

    return categorySteps;
  }
}
