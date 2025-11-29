import AsyncStorage from '@react-native-async-storage/async-storage';

const STORY_SYSTEM_PROMPT_KEY = 'story_system_prompt';
const CHARACTER_SYSTEM_PROMPT_KEY = 'character_system_prompt';
const IMAGE_SYSTEM_PROMPT_KEY = 'image_system_prompt';

const DEFAULT_STORY_SYSTEM_PROMPT = `Du bist ein kreativer Geschichtenerzähler. Erzähle fesselnde, detaillierte Geschichten, die den Leser in ihren Bann ziehen. 
Verwende lebendige Beschreibungen und entwickle interessante Charaktere. Die Geschichte sollte einen klaren Spannungsbogen haben.`;

const DEFAULT_CHARACTER_SYSTEM_PROMPT = `Du bist ein Charakter-Designer. Erstelle einzigartige, vielschichtige Charaktere mit klarer Persönlichkeit und interessanter Hintergrundgeschichte. 
Der Charakter sollte authentisch und glaubwürdig sein, mit eigenen Stärken, Schwächen und Motivationen.`;

const DEFAULT_IMAGE_SYSTEM_PROMPT = `Create highly detailed, cinematic image descriptions for this story. Each description must be at least 4-5 sentences long and paint a vivid picture.

For each scene, describe in detail:
1. Main Subject & Action (What's happening in the scene, who/what is the focus)
2. Atmosphere & Mood (The emotional feeling, time of day, weather, season)
3. Lighting & Colors (Light sources, shadows, color palette, time of day effects)
4. Perspective & Composition (Camera angle, framing, depth, foreground/background elements)
5. Key Details & Textures (Surface details, materials, small but important elements)

Write in a cinematic, artistic style as if directing a movie scene or giving instructions to a professional artist.

Story:
[TEXT]

Reply with 5 numbered image descriptions. Each description MUST include all 5 aspects above and be at least 4-5 sentences long.
Format each description as:

1. [Highly detailed, multi-sentence description covering all 5 aspects]
2. [Highly detailed, multi-sentence description covering all 5 aspects]
etc.

Example of the required detail level:
"A tiny emerald green salamander sits motionless on a bed of thick, damp moss, surrounded by a forest of delicate maidenhair ferns that create intricate lacework patterns above. Ethereal morning mist hangs in the air, creating a mystical atmosphere while early dawn light filters through the dense canopy, casting dappled emerald and gold shadows across the scene. The lighting is soft and diffused, with occasional rays of sunlight breaking through to illuminate dewdrops on the ferns, creating tiny prisms of rainbow light, while the overall color palette stays in rich greens and deep forest browns. Shot from a dramatic low angle mere inches from the ground, making the small salamander appear heroic against the towering ferns, with layers of misty forest receding into a dreamy soft-focus background. The salamander's skin is intricately textured with tiny bumps and ridges that glisten with moisture, while delicate water beads cling to the moss beneath it, and wispy tendrils of morning fog weave between the dark tree trunks in the distance."`;

export async function getStorySystemPrompt(): Promise<string> {
	try {
		const prompt = await AsyncStorage.getItem(STORY_SYSTEM_PROMPT_KEY);
		return prompt || DEFAULT_STORY_SYSTEM_PROMPT;
	} catch (error) {
		console.error('Error getting story system prompt:', error);
		return DEFAULT_STORY_SYSTEM_PROMPT;
	}
}

export async function saveStorySystemPrompt(prompt: string): Promise<void> {
	try {
		await AsyncStorage.setItem(STORY_SYSTEM_PROMPT_KEY, prompt);
	} catch (error) {
		console.error('Error saving story system prompt:', error);
		throw error;
	}
}

export async function getCharacterSystemPrompt(): Promise<string> {
	try {
		const prompt = await AsyncStorage.getItem(CHARACTER_SYSTEM_PROMPT_KEY);
		return prompt || DEFAULT_CHARACTER_SYSTEM_PROMPT;
	} catch (error) {
		console.error('Error getting character system prompt:', error);
		return DEFAULT_CHARACTER_SYSTEM_PROMPT;
	}
}

export async function saveCharacterSystemPrompt(prompt: string): Promise<void> {
	try {
		await AsyncStorage.setItem(CHARACTER_SYSTEM_PROMPT_KEY, prompt);
	} catch (error) {
		console.error('Error saving character system prompt:', error);
		throw error;
	}
}

export async function getImageSystemPrompt(): Promise<string> {
	try {
		const prompt = await AsyncStorage.getItem(IMAGE_SYSTEM_PROMPT_KEY);
		return prompt || DEFAULT_IMAGE_SYSTEM_PROMPT;
	} catch (error) {
		console.error('Error getting image system prompt:', error);
		return DEFAULT_IMAGE_SYSTEM_PROMPT;
	}
}

export async function saveImageSystemPrompt(prompt: string): Promise<void> {
	try {
		await AsyncStorage.setItem(IMAGE_SYSTEM_PROMPT_KEY, prompt);
	} catch (error) {
		console.error('Error saving image system prompt:', error);
		throw error;
	}
}
