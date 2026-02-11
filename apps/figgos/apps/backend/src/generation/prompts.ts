import type { CardStyle, FigureLanguage } from '@figgos/shared';

// ══════════════════════════════════════════════════════════════
// Profile Generation — System Prompt
// ══════════════════════════════════════════════════════════════

export const PROFILE_SYSTEM_PROMPT = `You are the creative engine behind FIGGOS — a collectible action figure game. Users give you a name and a short description of a character, and you generate a full character profile for their collectible figure card.

The figure will be rendered as a hyperrealistic miniature sculpture (6 inches tall) inside toy blister packaging. Your job is to flesh out the character with personality, lore, and visual detail.

IMPORTANT RULES:
- The \`visualDescription\` must describe ONLY the figure itself (person, clothing, pose, expression). NOT the packaging, card, or background. It will be inserted into an image prompt after "In the left compartment stands the figure:".
- The \`visualDescription\` should be grounded and specific — real fabrics, real colors, real materials. Avoid vague fantasy language. Think "rumpled beige linen trenchcoat" not "magical cloak of mystery".
- IMPORTANT: Never use pure white for clothing, accessories, or any part of the figure. Use off-white, cream, ivory, light gray, or eggshell instead. The figure will be photographed on a white background, so pure white areas would blend into the background.
- Items must be concrete physical objects that can be shown as miniature accessories in blister compartments. Think action figure accessories: weapons, tools, personal objects. NOT abstract concepts.
- The backstory should be dramatic but concise. Written like the back of a trading card.
- Stats must be within the provided range for the rarity level.
- The \`specialAttack\` is the figure's signature move. It should connect thematically to the character and can reference one of their items (e.g. a chef might hurl their rolling pin). Higher rarity figures should have more dramatic, over-the-top special attacks. Common = practical and grounded. Legendary = cinematic and awe-inspiring.`;

export function buildProfileUserPrompt(
	name: string,
	description: string,
	rarity: string,
	statRange: { min: number; max: number },
	language: FigureLanguage
): string {
	const langInstruction =
		language === 'de'
			? '\n\nIMPORTANT: Generate ALL text content (subtitle, backstory, items, specialAttack) in German. Only the visualDescription should remain in English (it feeds into an image generation prompt).'
			: '';

	return `Generate a full character profile for this collectible figure:

**Name:** ${name}
**Description:** ${description}
**Rarity:** ${rarity.toUpperCase()}

**Stats range for ${rarity}:** each stat (attack, defense, special) must be between ${statRange.min} and ${statRange.max}.

Generate: subtitle, 3 items, backstory, stats, special attack, and a detailed visual description of the figure.${langInstruction}`;
}

// ══════════════════════════════════════════════════════════════
// Gemini JSON Schema for structured output
// ══════════════════════════════════════════════════════════════

export const PROFILE_JSON_SCHEMA = {
	type: 'object' as const,
	properties: {
		subtitle: {
			type: 'string' as const,
			description: 'A short role/title for the figure, 2-6 words. Like a job title or faction.',
		},
		items: {
			type: 'array' as const,
			items: {
				type: 'object' as const,
				properties: {
					name: {
						type: 'string' as const,
						description: 'Short punchy item name, 1-4 words.',
					},
					description: {
						type: 'string' as const,
						description: "One sentence describing the item's appearance.",
					},
					lore: {
						type: 'string' as const,
						description: 'One sentence of flavor text.',
					},
				},
				required: ['name', 'description', 'lore'] as const,
			},
			description: 'Exactly 3 physical accessories/items the figure carries.',
		},
		backstory: {
			type: 'string' as const,
			description: '2-3 sentences of character lore.',
		},
		stats: {
			type: 'object' as const,
			properties: {
				attack: { type: 'integer' as const },
				defense: { type: 'integer' as const },
				special: { type: 'integer' as const },
			},
			required: ['attack', 'defense', 'special'] as const,
		},
		specialAttack: {
			type: 'object' as const,
			properties: {
				name: {
					type: 'string' as const,
					description: 'Short punchy attack name, 2-4 words.',
				},
				description: {
					type: 'string' as const,
					description: '1-2 sentences describing the attack.',
				},
			},
			required: ['name', 'description'] as const,
		},
		visualDescription: {
			type: 'string' as const,
			description:
				'Detailed physical description of the figure as a miniature collectible sculpture. 3-5 sentences.',
		},
	},
	required: [
		'subtitle',
		'items',
		'backstory',
		'stats',
		'specialAttack',
		'visualDescription',
	] as const,
};

// ══════════════════════════════════════════════════════════════
// Image Generation — Rarity Styles
// ══════════════════════════════════════════════════════════════

interface RarityStyle {
	card: string;
	textStyle: string;
	tag: string;
	vibe: string;
}

export const RARITY_STYLES: Record<CardStyle, RarityStyle> = {
	// -- Common: Everyday packaging, several sub-types --
	common_kraft: {
		card: 'Warm tan kraft cardboard backing card with natural paper fiber texture.',
		textStyle: 'bold black uppercase',
		tag: 'A small rounded rectangular tag in the top-right corner of the card reading "COMMON" in dark gray text on a light gray background.',
		vibe: '',
	},
	common_white: {
		card: 'Clean white matte cardstock backing card with a subtle linen texture.',
		textStyle: 'bold black uppercase',
		tag: 'A small rounded rectangular tag in the top-right corner of the card reading "COMMON" in dark gray text on a light gray background.',
		vibe: '',
	},
	common_mint: {
		card: 'Matte mint-green cardstock backing card with a clean modern feel.',
		textStyle: 'bold dark green uppercase',
		tag: 'A small rounded rectangular tag in the top-right corner of the card reading "COMMON" in dark green text on a pale green background.',
		vibe: '',
	},
	common_warm: {
		card: 'Warm terracotta/clay-colored matte cardstock backing card.',
		textStyle: 'bold dark brown uppercase',
		tag: 'A small rounded rectangular tag in the top-right corner of the card reading "COMMON" in brown text on a pale peach background.',
		vibe: '',
	},

	// -- Rare: Blue/Silver premium --
	rare: {
		card: 'Dark navy blue matte cardstock backing card with a subtle brushed metal texture.',
		textStyle: 'silver metallic uppercase',
		tag: 'A metallic blue tag with silver border in the top-right corner reading "RARE" in silver text. The tag has a subtle shine.',
		vibe: 'The overall packaging has a premium, curated feel — a step above standard retail.',
	},

	// -- Epic: Neon/Holographic, high energy --
	epic: {
		card: 'Glossy black cardstock backing card covered in a vivid holographic rainbow foil pattern that shifts between electric purple, hot pink, and cyan as light hits it. The entire card surface shimmers and refracts light like an oil slick. Bright neon purple geometric accent lines and circuit-board-style patterns are printed over the holographic surface.',
		textStyle:
			'neon purple glowing uppercase text that appears to emit light, with a bright pink-to-cyan gradient and a visible luminous halo around each letter',
		tag: 'A large holographic tag in the top-right corner reading "EPIC" in bold glowing white text on a shifting purple-pink-cyan iridescent background. The tag is eye-catching and impossible to miss — it pulses with energy.',
		vibe: 'This packaging is LOUD and electric. It demands attention. The holographic surface throws rainbow light everywhere. The neon accents make it feel like it belongs in an arcade or a cyberpunk display case. Nothing about this is subtle.',
	},

	// -- Legendary: Ultra-luxury black & gold, museum piece --
	legendary: {
		card: 'Ultra-premium heavyweight matte black cardstock with a wide ornate gold foil border featuring intricate filigree scrollwork patterns embossed into the card. Gold foil decorative corner pieces with Art Deco geometric designs. A subtle gold foil crest or emblem is centered above the figure name. The card itself has a soft-touch velvet-like texture.',
		textStyle:
			'large gold foil embossed uppercase with deep dimensional relief — the letters are stamped into the card and filled with brilliant reflective gold that catches studio light with a mirror-like gleam',
		tag: 'An oversized ornate gold foil tag in the top-right corner with decorative Art Deco border reading "LEGENDARY" in bold black serif text on a brilliant gold background. The tag has visible embossed texture and gleams like real jewelry under the light.',
		vibe: "This is a once-in-a-lifetime collector's grail piece. The gold foil work is exquisite and covers significant portions of the card — borders, corners, crest, lettering. It looks like it belongs in a glass display case in a luxury boutique, not on a shelf. The contrast of deep matte black and brilliant gold is stunning. Every detail communicates exclusivity and extreme rarity. This packaging alone is worth collecting.",
	},
};

// ══════════════════════════════════════════════════════════════
// Image Generation — Prompt Builder
// ══════════════════════════════════════════════════════════════

const REALISM_BLOCK = `This is not a plastic toy — it is a perfect miniature real human being, 6 inches tall, frozen in place. The skin has actual pores and subtle color variation. The clothing is real miniaturized fabric with natural drape, wrinkles, and weave texture. The materials are genuine — real leather grain, real fabric thread, real hair strands catching the light.`;

export function buildImagePrompt(
	name: string,
	subtitle: string,
	visualDescription: string,
	items: string[],
	cardStyle: CardStyle,
	hasFace: boolean = false
): string {
	const style = RARITY_STYLES[cardStyle];
	const itemsText = items
		.slice(0, 3)
		.map((item) => `  - ${item}`)
		.join('\n');

	const faceInstruction = hasFace
		? `\n\nCRITICAL — FACE TRANSFER: The provided reference photo shows the person's real face. The miniature figure MUST have this EXACT face — same facial structure, same features, same expression — but rendered in the miniature figure style. Preserve the likeness perfectly while matching the figure's aesthetic.`
		: '';

	return `Product photograph of a premium collectible figure in sealed blister packaging on a pure white background. Package fills 95% of frame.

${style.card} Hanging hole at top center. Clear plastic blister with molded compartments.

${style.tag}

Name in ${style.textStyle}: "${name.toUpperCase()}" large at the top. "${subtitle.toUpperCase()}" in smaller text below.

In the left compartment stands the figure: ${visualDescription}

${REALISM_BLOCK}
${style.vibe}${faceInstruction}

Three accessories in separate molded blister compartments on the right side, stacked vertically:
${itemsText}
Each accessory is detailed, clearly visible, and generously sized.

IMPORTANT: The figure and accessories must NOT contain pure white (#FFFFFF) areas. Use off-white, cream, ivory, or light gray instead of white for any clothing, skin highlights, or materials. Pure white is reserved for the background only.

Pure white background, soft even studio lighting, product catalog quality. 85mm lens, sharp focus.`;
}
