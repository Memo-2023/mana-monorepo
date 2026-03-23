/**
 * @manacore/credit-operations
 *
 * Central credit operation definitions for all Mana apps.
 * This package defines operation types, costs, and helper functions
 * for the unified credit system across the ecosystem.
 */

// ============================================================================
// Operation Types
// ============================================================================

/**
 * All credit operations across the Mana ecosystem.
 * Operations are categorized by type: AI, productivity (micro), and premium.
 */
export enum CreditOperationType {
	// -------------------------------------------------------------------------
	// AI Operations (Standard Credits: 1-30)
	// -------------------------------------------------------------------------

	// Chat - AI conversations
	AI_CHAT_GPT4 = 'ai_chat_gpt4',
	AI_CHAT_CLAUDE = 'ai_chat_claude',
	AI_CHAT_GEMINI = 'ai_chat_gemini',
	AI_CHAT_QWEN = 'ai_chat_qwen',
	AI_CHAT_OLLAMA = 'ai_chat_ollama',

	// Picture - Image generation
	AI_IMAGE_GENERATION = 'ai_image_generation',
	AI_IMAGE_UPSCALE = 'ai_image_upscale',

	// Questions - Research
	AI_RESEARCH_QUICK = 'ai_research_quick',
	AI_RESEARCH_DEEP = 'ai_research_deep',

	// NutriPhi - Food analysis
	AI_FOOD_ANALYSIS = 'ai_food_analysis',

	// ManaDeck - AI deck generation
	AI_DECK_GENERATION = 'ai_deck_generation',
	AI_CARD_GENERATION = 'ai_card_generation',

	// Zitare - AI explanations
	AI_QUOTE_EXPLANATION = 'ai_quote_explanation',

	// Planta - Plant analysis
	AI_PLANT_ANALYSIS = 'ai_plant_analysis',

	// Traces - City guide generation
	AI_GUIDE_GENERATION = 'ai_guide_generation',

	// Context - AI text generation
	AI_CONTEXT_GENERATION = 'ai_context_generation',

	// Matrix Bots - Bot chat
	AI_BOT_CHAT = 'ai_bot_chat',

	// General AI features
	AI_SMART_SCHEDULING = 'ai_smart_scheduling',
	AI_SUGGESTIONS = 'ai_suggestions',
	AI_ENRICHMENT = 'ai_enrichment',

	// -------------------------------------------------------------------------
	// Productivity Operations (Micro Credits: 0.01-0.10)
	// -------------------------------------------------------------------------

	// Todo
	TASK_CREATE = 'task_create',
	PROJECT_CREATE = 'project_create',

	// Calendar
	EVENT_CREATE = 'event_create',
	CALENDAR_CREATE = 'calendar_create',

	// Contacts
	CONTACT_CREATE = 'contact_create',

	// Zitare
	COLLECTION_CREATE = 'collection_create',

	// Presi
	PRESENTATION_CREATE = 'presentation_create',
	SLIDE_CREATE = 'slide_create',

	// -------------------------------------------------------------------------
	// Premium Features (Standard Credits: 0.5-5)
	// -------------------------------------------------------------------------

	// Sync features
	CALDAV_SYNC = 'caldav_sync',
	GOOGLE_SYNC = 'google_sync',
	CLOUD_SYNC = 'cloud_sync',

	// Import/Export
	BULK_IMPORT = 'bulk_import',
	PDF_EXPORT = 'pdf_export',

	// Premium themes
	PREMIUM_THEME = 'premium_theme',
}

// ============================================================================
// Credit Costs
// ============================================================================

/**
 * Credit costs for each operation type.
 * Costs are in Credits (decimal values supported for micro-credits).
 */
export const CREDIT_COSTS: Record<CreditOperationType, number> = {
	// AI Operations (Standard Credits)
	[CreditOperationType.AI_CHAT_GPT4]: 5,
	[CreditOperationType.AI_CHAT_CLAUDE]: 5,
	[CreditOperationType.AI_CHAT_GEMINI]: 2,
	[CreditOperationType.AI_CHAT_QWEN]: 2,
	[CreditOperationType.AI_CHAT_OLLAMA]: 0.1,

	[CreditOperationType.AI_IMAGE_GENERATION]: 10,
	[CreditOperationType.AI_IMAGE_UPSCALE]: 5,

	[CreditOperationType.AI_RESEARCH_QUICK]: 5,
	[CreditOperationType.AI_RESEARCH_DEEP]: 25,

	[CreditOperationType.AI_FOOD_ANALYSIS]: 3,

	[CreditOperationType.AI_DECK_GENERATION]: 20,
	[CreditOperationType.AI_CARD_GENERATION]: 2,

	[CreditOperationType.AI_QUOTE_EXPLANATION]: 2,

	[CreditOperationType.AI_PLANT_ANALYSIS]: 2,
	[CreditOperationType.AI_GUIDE_GENERATION]: 5,
	[CreditOperationType.AI_CONTEXT_GENERATION]: 2,
	[CreditOperationType.AI_BOT_CHAT]: 0.1,

	[CreditOperationType.AI_SMART_SCHEDULING]: 2,
	[CreditOperationType.AI_SUGGESTIONS]: 2,
	[CreditOperationType.AI_ENRICHMENT]: 2,

	// Productivity Operations (Micro Credits)
	[CreditOperationType.TASK_CREATE]: 0.02,
	[CreditOperationType.PROJECT_CREATE]: 0.1,

	[CreditOperationType.EVENT_CREATE]: 0.02,
	[CreditOperationType.CALENDAR_CREATE]: 0.1,

	[CreditOperationType.CONTACT_CREATE]: 0.02,

	[CreditOperationType.COLLECTION_CREATE]: 0.1,

	[CreditOperationType.PRESENTATION_CREATE]: 0.5,
	[CreditOperationType.SLIDE_CREATE]: 0.02,

	// Premium Features
	[CreditOperationType.CALDAV_SYNC]: 0.5,
	[CreditOperationType.GOOGLE_SYNC]: 0.5,
	[CreditOperationType.CLOUD_SYNC]: 5, // Monthly

	[CreditOperationType.BULK_IMPORT]: 0.2, // Per 10 items
	[CreditOperationType.PDF_EXPORT]: 1,

	[CreditOperationType.PREMIUM_THEME]: 3,
};

// ============================================================================
// Operation Metadata
// ============================================================================

/**
 * Category of credit operation for grouping and display.
 */
export enum CreditCategory {
	AI = 'ai',
	PRODUCTIVITY = 'productivity',
	PREMIUM = 'premium',
}

/**
 * Metadata about each operation for UI display and documentation.
 */
export interface OperationMetadata {
	/** Human-readable name */
	name: string;
	/** Description for tooltips/help */
	description: string;
	/** Category for grouping */
	category: CreditCategory;
	/** Which app this operation belongs to */
	app: string;
	/** Is this a per-item cost (e.g., bulk import per 10 items) */
	perItem?: boolean;
	/** Item unit name if perItem is true */
	itemUnit?: string;
}

/**
 * Metadata for all operations.
 */
export const OPERATION_METADATA: Record<CreditOperationType, OperationMetadata> = {
	// AI Chat
	[CreditOperationType.AI_CHAT_GPT4]: {
		name: 'GPT-4 Message',
		description: 'Send a message using GPT-4 or GPT-4o',
		category: CreditCategory.AI,
		app: 'chat',
	},
	[CreditOperationType.AI_CHAT_CLAUDE]: {
		name: 'Claude Message',
		description: 'Send a message using Claude (Anthropic)',
		category: CreditCategory.AI,
		app: 'chat',
	},
	[CreditOperationType.AI_CHAT_GEMINI]: {
		name: 'Gemini Message',
		description: 'Send a message using Google Gemini',
		category: CreditCategory.AI,
		app: 'chat',
	},
	[CreditOperationType.AI_CHAT_QWEN]: {
		name: 'Qwen Message',
		description: 'Send a message using Qwen',
		category: CreditCategory.AI,
		app: 'chat',
	},
	[CreditOperationType.AI_CHAT_OLLAMA]: {
		name: 'Ollama Message (Local)',
		description: 'Send a message using local Ollama models',
		category: CreditCategory.AI,
		app: 'chat',
	},

	// Image Generation
	[CreditOperationType.AI_IMAGE_GENERATION]: {
		name: 'Generate Image',
		description: 'Generate an AI image',
		category: CreditCategory.AI,
		app: 'picture',
	},
	[CreditOperationType.AI_IMAGE_UPSCALE]: {
		name: 'Upscale Image',
		description: 'Upscale an image to higher resolution',
		category: CreditCategory.AI,
		app: 'picture',
	},

	// Research
	[CreditOperationType.AI_RESEARCH_QUICK]: {
		name: 'Quick Research',
		description: 'Quick research with 5 sources',
		category: CreditCategory.AI,
		app: 'questions',
	},
	[CreditOperationType.AI_RESEARCH_DEEP]: {
		name: 'Deep Research',
		description: 'Comprehensive research with 30+ sources',
		category: CreditCategory.AI,
		app: 'questions',
	},

	// Food Analysis
	[CreditOperationType.AI_FOOD_ANALYSIS]: {
		name: 'Analyze Food Photo',
		description: 'Analyze nutrition from a food photo',
		category: CreditCategory.AI,
		app: 'nutriphi',
	},

	// Deck Generation
	[CreditOperationType.AI_DECK_GENERATION]: {
		name: 'Generate AI Deck',
		description: 'Generate a complete deck with AI (10 cards)',
		category: CreditCategory.AI,
		app: 'manadeck',
	},
	[CreditOperationType.AI_CARD_GENERATION]: {
		name: 'Generate AI Card',
		description: 'Generate a single card with AI',
		category: CreditCategory.AI,
		app: 'manadeck',
	},

	// Quote Explanation
	[CreditOperationType.AI_QUOTE_EXPLANATION]: {
		name: 'Explain Quote',
		description: 'Get an AI explanation of a quote',
		category: CreditCategory.AI,
		app: 'zitare',
	},

	// Planta
	[CreditOperationType.AI_PLANT_ANALYSIS]: {
		name: 'Plant Analysis',
		description: 'Identify and analyze a plant from a photo',
		category: CreditCategory.AI,
		app: 'planta',
	},

	// Traces
	[CreditOperationType.AI_GUIDE_GENERATION]: {
		name: 'City Guide Generation',
		description: 'Generate an AI-powered city walking guide',
		category: CreditCategory.AI,
		app: 'traces',
	},

	// Context
	[CreditOperationType.AI_CONTEXT_GENERATION]: {
		name: 'AI Text Generation',
		description: 'Generate or transform text with AI',
		category: CreditCategory.AI,
		app: 'context',
	},

	// Matrix Bots
	[CreditOperationType.AI_BOT_CHAT]: {
		name: 'Bot Chat Message',
		description: 'Chat with AI via Matrix bot',
		category: CreditCategory.AI,
		app: 'matrix',
	},

	// General AI
	[CreditOperationType.AI_SMART_SCHEDULING]: {
		name: 'Smart Scheduling',
		description: 'AI-powered task scheduling suggestions',
		category: CreditCategory.AI,
		app: 'todo',
	},
	[CreditOperationType.AI_SUGGESTIONS]: {
		name: 'AI Suggestions',
		description: 'Get AI-powered suggestions',
		category: CreditCategory.AI,
		app: 'general',
	},
	[CreditOperationType.AI_ENRICHMENT]: {
		name: 'AI Enrichment',
		description: 'Enrich data with AI-gathered information',
		category: CreditCategory.AI,
		app: 'contacts',
	},

	// Productivity - Todo
	[CreditOperationType.TASK_CREATE]: {
		name: 'Create Task',
		description: 'Create a new task',
		category: CreditCategory.PRODUCTIVITY,
		app: 'todo',
	},
	[CreditOperationType.PROJECT_CREATE]: {
		name: 'Create Project',
		description: 'Create a new project',
		category: CreditCategory.PRODUCTIVITY,
		app: 'todo',
	},

	// Productivity - Calendar
	[CreditOperationType.EVENT_CREATE]: {
		name: 'Create Event',
		description: 'Create a calendar event',
		category: CreditCategory.PRODUCTIVITY,
		app: 'calendar',
	},
	[CreditOperationType.CALENDAR_CREATE]: {
		name: 'Create Calendar',
		description: 'Create a new calendar',
		category: CreditCategory.PRODUCTIVITY,
		app: 'calendar',
	},

	// Productivity - Contacts
	[CreditOperationType.CONTACT_CREATE]: {
		name: 'Create Contact',
		description: 'Create a new contact',
		category: CreditCategory.PRODUCTIVITY,
		app: 'contacts',
	},

	// Productivity - Zitare
	[CreditOperationType.COLLECTION_CREATE]: {
		name: 'Create Collection',
		description: 'Create a quote collection',
		category: CreditCategory.PRODUCTIVITY,
		app: 'zitare',
	},

	// Productivity - Presi
	[CreditOperationType.PRESENTATION_CREATE]: {
		name: 'Create Presentation',
		description: 'Create a new presentation',
		category: CreditCategory.PRODUCTIVITY,
		app: 'presi',
	},
	[CreditOperationType.SLIDE_CREATE]: {
		name: 'Create Slide',
		description: 'Add a slide to a presentation',
		category: CreditCategory.PRODUCTIVITY,
		app: 'presi',
	},

	// Premium - Sync
	[CreditOperationType.CALDAV_SYNC]: {
		name: 'CalDAV Sync',
		description: 'Sync with CalDAV server',
		category: CreditCategory.PREMIUM,
		app: 'calendar',
	},
	[CreditOperationType.GOOGLE_SYNC]: {
		name: 'Google Sync',
		description: 'Sync with Google services',
		category: CreditCategory.PREMIUM,
		app: 'contacts',
	},
	[CreditOperationType.CLOUD_SYNC]: {
		name: 'Cloud Sync (Monthly)',
		description: 'Enable cloud synchronization',
		category: CreditCategory.PREMIUM,
		app: 'skilltree',
	},

	// Premium - Import/Export
	[CreditOperationType.BULK_IMPORT]: {
		name: 'Bulk Import',
		description: 'Import items in bulk',
		category: CreditCategory.PREMIUM,
		app: 'general',
		perItem: true,
		itemUnit: '10 items',
	},
	[CreditOperationType.PDF_EXPORT]: {
		name: 'PDF Export',
		description: 'Export to PDF format',
		category: CreditCategory.PREMIUM,
		app: 'presi',
	},

	// Premium - Themes
	[CreditOperationType.PREMIUM_THEME]: {
		name: 'Premium Theme',
		description: 'Use a premium theme',
		category: CreditCategory.PREMIUM,
		app: 'presi',
	},
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the credit cost for an operation.
 * @param operation The operation type
 * @returns The cost in credits
 */
export function getCreditCost(operation: CreditOperationType): number {
	return CREDIT_COSTS[operation];
}

/**
 * Get the metadata for an operation.
 * @param operation The operation type
 * @returns Operation metadata
 */
export function getOperationMetadata(operation: CreditOperationType): OperationMetadata {
	return OPERATION_METADATA[operation];
}

/**
 * Get all operations for a specific app.
 * @param app The app name (e.g., 'chat', 'todo', 'calendar')
 * @returns Array of operations for that app
 */
export function getOperationsForApp(app: string): CreditOperationType[] {
	return Object.entries(OPERATION_METADATA)
		.filter(([, meta]) => meta.app === app)
		.map(([op]) => op as CreditOperationType);
}

/**
 * Get all operations in a specific category.
 * @param category The category
 * @returns Array of operations in that category
 */
export function getOperationsByCategory(category: CreditCategory): CreditOperationType[] {
	return Object.entries(OPERATION_METADATA)
		.filter(([, meta]) => meta.category === category)
		.map(([op]) => op as CreditOperationType);
}

/**
 * Calculate total cost for bulk operations.
 * @param operation The operation type
 * @param count Number of items
 * @returns Total cost in credits
 */
export function calculateBulkCost(operation: CreditOperationType, count: number): number {
	const cost = CREDIT_COSTS[operation];
	const meta = OPERATION_METADATA[operation];

	if (meta.perItem) {
		// For bulk operations, cost is per batch (e.g., per 10 items)
		return Math.ceil(count / 10) * cost;
	}

	return cost * count;
}

/**
 * Check if an operation is considered "free" (no credit cost).
 * @param operation The operation type
 * @returns True if the operation is free
 */
export function isFreeOperation(operation: CreditOperationType): boolean {
	return CREDIT_COSTS[operation] === 0;
}

/**
 * Check if an operation is a micro-credit operation (< 0.5 credits).
 * @param operation The operation type
 * @returns True if micro-credit operation
 */
export function isMicroCreditOperation(operation: CreditOperationType): boolean {
	const cost = CREDIT_COSTS[operation];
	return cost > 0 && cost < 0.5;
}

/**
 * Check if an operation is an AI operation.
 * @param operation The operation type
 * @returns True if AI operation
 */
export function isAiOperation(operation: CreditOperationType): boolean {
	return OPERATION_METADATA[operation].category === CreditCategory.AI;
}

/**
 * Format credit cost for display.
 * @param cost The credit cost
 * @returns Formatted string (e.g., "0.02" or "5")
 */
export function formatCreditCost(cost: number): string {
	if (cost === 0) return 'Free';
	if (cost < 1) return cost.toFixed(2);
	return cost.toString();
}

/**
 * Get a pricing table for an app (for display in UI).
 * @param app The app name
 * @returns Array of pricing entries
 */
export function getPricingTable(app: string): Array<{
	operation: CreditOperationType;
	name: string;
	description: string;
	cost: number;
	formattedCost: string;
	category: CreditCategory;
}> {
	return getOperationsForApp(app).map((op) => {
		const meta = OPERATION_METADATA[op];
		const cost = CREDIT_COSTS[op];
		return {
			operation: op,
			name: meta.name,
			description: meta.description,
			cost,
			formattedCost: formatCreditCost(cost),
			category: meta.category,
		};
	});
}

// ============================================================================
// Free Operations List
// ============================================================================

/**
 * Operations that are always free (no credit cost).
 * These are read operations, status checks, and engagement actions.
 */
export const FREE_OPERATIONS = [
	// Reading/viewing
	'read',
	'view',
	'list',
	'get',
	'search',
	'browse',

	// Task completion (engagement)
	'complete',
	'check',
	'toggle',

	// Editing (no new resource creation)
	'update',
	'edit',
	'modify',

	// Deletion
	'delete',
	'remove',
	'archive',

	// Organization
	'sort',
	'filter',
	'move',
	'reorder',

	// Metadata
	'tag',
	'label',
	'favorite',
	'unfavorite',
] as const;

/**
 * Check if an action name represents a free operation.
 * @param action The action name (e.g., 'update', 'delete')
 * @returns True if the action is free
 */
export function isFreeAction(action: string): boolean {
	const normalizedAction = action.toLowerCase();
	return FREE_OPERATIONS.some(
		(freeOp) => normalizedAction === freeOp || normalizedAction.startsWith(`${freeOp}_`)
	);
}
