export type NodeKind = 'world' | 'character' | 'object' | 'place' | 'story';
export type VisibilityLevel = 'private' | 'shared' | 'public';
export type StoryEntryType = 'narration' | 'dialog' | 'note';

export interface GenerationContext {
	userPrompt: string;
	systemPrompt: string;
	worldContext?: string;
	worldDetails?: {
		title: string;
		summary?: string;
		appearance?: string;
		lore?: string;
	};
	selectedCharacters?: Array<{
		name: string;
		slug: string;
		summary?: string;
		appearance?: string;
		voice_style?: string;
		motivations?: string;
		capabilities?: string;
	}>;
	selectedPlace?: {
		name: string;
		slug: string;
		summary?: string;
		appearance?: string;
		capabilities?: string;
		constraints?: string;
	};
	model: string;
	timestamp: string;
}

export interface ContentNode {
	id: string;
	kind: NodeKind;
	slug: string;
	title: string;
	summary?: string;
	owner_id?: string;
	visibility: VisibilityLevel;
	tags: string[];
	world_slug?: string;
	content: ContentData;
	memory?: CharacterMemory;
	skills?: CharacterSkills;
	custom_schema?: any; // Will be CustomFieldSchema from customFields.ts
	custom_data?: Record<string, any>; // CustomFieldData
	schema_version?: number;
	generation_prompt?: string;
	generation_model?: string;
	generation_date?: string;
	generation_context?: GenerationContext;
	image_url?: string;
	created_at: string;
	updated_at: string;
}

export interface ContentData {
	appearance?: string;
	image_prompt?: string;
	lore?: string;
	voice_style?: string;
	capabilities?: string;
	constraints?: string;
	motivations?: string;
	secrets?: string;
	relationships_text?: string;
	inventory_text?: string;
	timeline_text?: string;
	glossary_text?: string;
	canon_facts_text?: string;
	state_text?: string;
	prompt_guidelines?: string;
	references?: string;
	_links?: Record<string, string[]>;
	_aliases?: string[];
	_i18n?: Record<string, any>;
	// Index signature für dynamische Content-Felder
	[key: string]: string | Record<string, string[]> | string[] | Record<string, any> | undefined;
}

export interface StoryEntry {
	id: string;
	story_slug: string;
	position: number;
	type: StoryEntryType;
	speaker_slug?: string;
	body: string;
	created_by?: string;
	created_at: string;
}

export interface PromptTemplate {
	id: string;
	owner_id?: string;
	world_slug?: string;
	kind: NodeKind;
	title: string;
	prompt_template: string;
	description?: string;
	tags?: string[];
	usage_count: number;
	is_public: boolean;
	created_at: string;
	updated_at: string;
}

export interface PromptHistory {
	id: string;
	user_id: string;
	node_id: string;
	prompt: string;
	response?: any;
	model?: string;
	created_at: string;
}

// Memory System Types
export interface ShortTermMemory {
	id: string;
	timestamp: string;
	content: string;
	location?: string;
	involved?: string[];
	tags?: string[];
	importance: number;
	decay_at: string;
}

export interface MediumTermMemory {
	id: string;
	timestamp: string;
	content: string;
	original_details?: string;
	context?: string;
	location?: string;
	involved?: string[];
	tags?: string[];
	importance: number;
	decay_at: string;
	linked_memories?: string[];
}

export interface LongTermMemory {
	id: string;
	timestamp: string;
	content: string;
	emotional_weight: number;
	category: 'trauma' | 'triumph' | 'relationship' | 'skill' | 'secret' | 'manual';
	triggers?: string[];
	effects?: string;
	involved?: string[];
	immutable: boolean;
}

export interface MemoryTraits {
	memory_quality: 'excellent' | 'good' | 'average' | 'poor';
	trauma_filter?: boolean;
	selective_memory?: string[];
	memory_conditions?: {
		drunk?: 'partial_blackout' | 'full_blackout' | 'fuzzy';
		stressed?: 'detail_loss' | 'time_gaps';
		happy?: 'enhanced_positive' | 'forget_negative';
	};
}

export interface CharacterMemory {
	short_term_memory: ShortTermMemory[];
	medium_term_memory: MediumTermMemory[];
	long_term_memory: LongTermMemory[];
	memory_traits: MemoryTraits;
	last_processed?: string;
}

// Skills System Types
export interface Skill {
	name: string;
	level: number;
	level_text?: string;
	subskills?: Record<string, string>;
	learned_from?: string;
	learned_at?: string;
	training_years?: number;
	last_used?: string;
	conditions?: Record<string, number>;
}

export interface LearningSkill {
	name: string;
	progress: number;
	teacher?: string;
	started: string;
	blocked_by?: string;
	next_milestone?: string;
}

export interface SkillCondition {
	trigger: string;
	effect: string;
}

export interface CharacterSkills {
	primary: Skill[];
	learning: LearningSkill[];
	conditions: Record<string, SkillCondition>;
}

// Memory Event for story integration
export interface MemoryEvent {
	id: string;
	node_id: string;
	story_id?: string;
	event_timestamp: string;
	event_type: 'observed' | 'experienced' | 'told' | 'dreamed' | 'remembered';
	raw_event: string;
	processed_memory?: any;
	memory_tier?: 'short' | 'medium' | 'long';
	importance?: number;
	created_at: string;
	updated_at?: string;
}
