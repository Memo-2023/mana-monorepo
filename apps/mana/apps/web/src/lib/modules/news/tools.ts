import type { ModuleTool } from '$lib/data/tools/types';
// News tools are limited — saveFromCurated requires a full LocalCachedArticle
// which is complex for LLM tool calling. Read-only for now.
export const newsTools: ModuleTool[] = [];
