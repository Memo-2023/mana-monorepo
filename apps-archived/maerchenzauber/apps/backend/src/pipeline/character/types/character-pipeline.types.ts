export interface CharacterCreationInput {
	userId: string;
	name: string;
	description: string;
	imagePrompt?: string;
	age?: string;
	personality?: string;
	voice?: string;
	language?: 'en' | 'de';
}

export interface CharacterValidationOutput extends CharacterCreationInput {
	validatedDescription: string;
	sanitizedName: string;
	estimatedCredits: number;
}

export interface CharacterPromptOutput extends CharacterValidationOutput {
	imageGenerationPrompt: string;
	characterStylePrompt: string;
	negativePrompt: string;
}

export interface CharacterImageOutput extends CharacterPromptOutput {
	imageUrl: string;
	imageId: string;
	imageDimensions: { width: number; height: number };
}

export interface CharacterDatabaseOutput extends CharacterImageOutput {
	characterId: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface CharacterCreditOutput extends CharacterDatabaseOutput {
	creditsDeducted: number;
	remainingCredits: number;
	transactionId: string;
}

export interface CharacterFinalOutput {
	success: boolean;
	character: {
		id: string;
		name: string;
		description: string;
		imageUrl: string;
		age?: string;
		personality?: string;
		voice?: string;
	};
	metadata: {
		creditsUsed: number;
		generationTime: number;
		pipelineSteps: string[];
	};
}
