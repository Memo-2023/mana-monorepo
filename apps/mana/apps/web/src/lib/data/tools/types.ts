/**
 * Tool Layer types — Standardized LLM access to module operations.
 *
 * Each module exports a ModuleTool[] array. The registry collects them
 * and generates LLM function-calling schemas. The executor validates
 * parameters and runs the tool.
 */

export interface ModuleTool {
	/** Unique tool name, e.g. 'create_task', 'log_drink' */
	name: string;
	/** Source module, e.g. 'todo', 'drink' */
	module: string;
	/** Human-readable description for the LLM function schema */
	description: string;
	/** Parameter definitions */
	parameters: ToolParameter[];
	/** Execute the tool. Params are pre-validated by the executor. */
	execute: (params: Record<string, unknown>) => Promise<ToolResult>;
}

export interface ToolParameter {
	name: string;
	type: 'string' | 'number' | 'boolean';
	description: string;
	required: boolean;
	enum?: string[];
}

export interface ToolResult {
	success: boolean;
	data?: unknown;
	/** Human-readable confirmation message */
	message: string;
}

/** JSON Schema for LLM function calling */
export interface LlmFunctionSchema {
	name: string;
	description: string;
	parameters: {
		type: 'object';
		properties: Record<string, LlmPropertySchema>;
		required: string[];
	};
}

export interface LlmPropertySchema {
	type: string;
	description: string;
	enum?: string[];
}
