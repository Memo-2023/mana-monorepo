export interface PipelineStep<TInput = any, TOutput = any> {
	name: string;
	description: string;
	category: string;
	execute: (input: TInput, context?: PipelineContext) => Promise<TOutput>;
	validate?: (input: TInput) => ValidationResult;
	rollback?: (input: TInput, error: Error, context?: PipelineContext) => Promise<void>;
	timeout?: number;
	retryable?: boolean;
	maxRetries?: number;
}

export interface ValidationResult {
	valid: boolean;
	errors?: string[];
}

export interface PipelineContext {
	userId?: string;
	requestId: string;
	startTime: Date;
	metadata: Record<string, any>;
	logs: ExecutionLog[];
}

export interface ExecutionLog {
	stepName: string;
	startTime: Date;
	endTime?: Date;
	duration?: number;
	input: any;
	output?: any;
	error?: string;
	status: 'running' | 'success' | 'failed' | 'skipped';
	metadata?: Record<string, any>;
}

export interface PipelineResult<T = any> {
	success: boolean;
	data?: T;
	error?: Error;
	executionLogs: ExecutionLog[];
	totalDuration: number;
	context: PipelineContext;
}

export type StepDefinition<TInput = any, TOutput = any> = {
	name: string;
	step: PipelineStep<TInput, TOutput>;
};
