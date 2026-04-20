/**
 * Converts AI_TOOL_CATALOG entries to OpenAI-spec function schemas.
 *
 * Every provider we support (Google Gemini, OpenAI, OpenRouter, Groq,
 * Together, Ollama 0.3+) speaks the same `{ type: "function", function:
 * { name, description, parameters } }` shape for tool declarations.
 * Parameters are JSON Schema. This converter is the single bridge
 * between our catalog format and the wire format — changing the catalog
 * shape only needs this file (plus tests) to be updated.
 *
 * The converter keeps tools lean: no `_rationale` meta-parameter, no
 * wrapper objects, no provider-specific tweaks. Identifying calls to
 * a specific policy decision (propose/auto/deny) is the executor's job,
 * not the model's.
 */

import type { ToolSchema } from './schemas';

/** OpenAI-compatible JSON-Schema property type. */
export interface JsonSchemaProperty {
	type: 'string' | 'number' | 'integer' | 'boolean';
	description?: string;
	enum?: readonly string[];
}

/** OpenAI-compatible JSON-Schema object wrapper. */
export interface JsonSchemaObject {
	type: 'object';
	properties: Record<string, JsonSchemaProperty>;
	required: string[];
}

/** OpenAI-compatible function declaration. */
export interface FunctionSpec {
	name: string;
	description: string;
	parameters: JsonSchemaObject;
}

/** OpenAI-compatible tool entry (only `function` tools are supported). */
export interface ToolSpec {
	type: 'function';
	function: FunctionSpec;
}

/** Map a ToolSchema parameter type ("string" | "number" | "boolean") to
 *  a JSON Schema type. Catalog values are already narrow enough to pass
 *  through, but we centralise the translation here for future-proofing
 *  (e.g. if we ever introduce `"integer"` as a distinct type). */
function mapParamType(t: string): JsonSchemaProperty['type'] {
	switch (t) {
		case 'string':
		case 'number':
		case 'integer':
		case 'boolean':
			return t;
		default:
			// Unknown types in the catalog are a bug, but don't silently
			// coerce to string — that would mask the mistake.
			throw new Error(`Unsupported parameter type in tool catalog: "${t}"`);
	}
}

/** Convert a single ToolSchema into an OpenAI-spec ToolSpec. */
export function toolToFunctionSchema(tool: ToolSchema): ToolSpec {
	const properties: Record<string, JsonSchemaProperty> = {};
	const required: string[] = [];

	for (const param of tool.parameters) {
		const prop: JsonSchemaProperty = {
			type: mapParamType(param.type),
			description: param.description,
		};
		if (param.enum && param.enum.length > 0) {
			prop.enum = param.enum;
		}
		properties[param.name] = prop;
		if (param.required) {
			required.push(param.name);
		}
	}

	return {
		type: 'function',
		function: {
			name: tool.name,
			description: tool.description,
			parameters: {
				type: 'object',
				properties,
				required,
			},
		},
	};
}

/** Convert a full tool list to OpenAI-spec entries in one call.
 *  Handy for building the `tools` field on a chat-completion request. */
export function toolsToFunctionSchemas(tools: readonly ToolSchema[]): ToolSpec[] {
	return tools.map(toolToFunctionSchema);
}
