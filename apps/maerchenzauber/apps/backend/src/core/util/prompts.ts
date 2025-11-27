export interface SystemPrompts {
	illustrator: string;
	storyCreator: string;
}

export interface PromptTemplates {
	story: string;
	illustration: string;
	storyBookIllustration: string;
	retryIllustration: string;
}

export interface Prompts {
	templates: PromptTemplates;
}

export const DEFAULT_PROMPTS: Prompts = {
	templates: {
		story: `write a children's animal book with 10 pages for children, there shouldnt be any human characters if so replace them, about {description}.

CRITICAL RULES ABOUT THE MAIN CHARACTER:
1. The main character's name is: {name}
2. The main character MUST be EXACTLY as described here: {characterDescription}
3. DO NOT change or reinterpret the animal type - if they are described as a pig, they MUST remain a pig throughout the entire story. If they are a fox, they must remain a fox. Never substitute or change the animal type.
4. Use the EXACT physical characteristics from the description provided
5. Always refer to the character by their name: {name}

Follow these rules strictly - the character description is the source of truth.`,
		illustration: `create for each page an illustration for a children's animal book from this story: {story}, there shouldnt be any human characters if so replace them.`,
		storyBookIllustration: `Style: 3D illustration, Disney pixar,
        create an illustration of: {illustration}.
        the characteristics {name} is described as: {characterDescription}
  `,
		retryIllustration: `When creating an illustration of a {description}, it failed with the following error: {error}, write a new prompt to create the illustration, keep the characteristics of the main character the same.`,
	},
};
