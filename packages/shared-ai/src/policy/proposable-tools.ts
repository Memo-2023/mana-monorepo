/**
 * Canonical list of tool names the AI is allowed to *propose*.
 *
 * Both the webapp's `DEFAULT_AI_POLICY` and the server-side
 * `AI_AVAILABLE_TOOLS` list in `services/mana-ai/` derive from here.
 * Adding a new proposable tool:
 *
 *   1. Append its name to {@link AI_PROPOSABLE_TOOL_NAMES}
 *   2. Add the tool with its params to `AI_AVAILABLE_TOOLS` in mana-ai
 *      (the contract test below ensures step 2 isn't forgotten)
 *   3. The webapp's `DEFAULT_AI_POLICY` picks it up automatically
 *
 * Tools NOT in this list default to `'propose'` only if the per-tool
 * policy map lacks an explicit entry. Most `auto` / `deny` decisions
 * stay hardcoded in the webapp policy — this shared list only covers
 * the tools the *server-side* planner actively proposes.
 */

export const AI_PROPOSABLE_TOOL_NAMES = [
	'create_task',
	'complete_task',
	'complete_tasks_by_title',
	'create_event',
	'create_place',
	'visit_place',
	'undo_drink',
	'save_news_article',
	'update_note',
	'append_to_note',
	'add_tag_to_note',
] as const;

export type AiProposableToolName = (typeof AI_PROPOSABLE_TOOL_NAMES)[number];

export const AI_PROPOSABLE_TOOL_SET: ReadonlySet<string> = new Set(AI_PROPOSABLE_TOOL_NAMES);
