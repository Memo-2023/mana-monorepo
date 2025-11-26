import { HttpException, HttpStatus } from '@nestjs/common';

export enum StoryErrorCode {
  CHARACTER_NOT_FOUND = 'CHARACTER_NOT_FOUND',
  CHARACTER_NOT_OWNED = 'CHARACTER_NOT_OWNED',
  CHARACTER_NOT_ANIMAL = 'CHARACTER_NOT_ANIMAL',
  STORY_GENERATION_FAILED = 'STORY_GENERATION_FAILED',
  ILLUSTRATION_GENERATION_FAILED = 'ILLUSTRATION_GENERATION_FAILED',
  IMAGE_GENERATION_FAILED = 'IMAGE_GENERATION_FAILED',
  TRANSLATION_FAILED = 'TRANSLATION_FAILED',
  TITLE_GENERATION_FAILED = 'TITLE_GENERATION_FAILED',
  STORAGE_ERROR = 'STORAGE_ERROR',
}

export class StoryException extends HttpException {
  constructor(
    public readonly code: StoryErrorCode,
    message: string,
    public readonly details?: any,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(
      {
        statusCode,
        error: code,
        message,
        details,
        timestamp: new Date().toISOString(),
      },
      statusCode,
    );
  }
}

export class CharacterNotFoundException extends StoryException {
  constructor(characterId: string) {
    super(
      StoryErrorCode.CHARACTER_NOT_FOUND,
      `Character with ID ${characterId} not found`,
      { characterId },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class CharacterNotOwnedException extends StoryException {
  constructor(characterId: string, userId: string) {
    super(
      StoryErrorCode.CHARACTER_NOT_OWNED,
      'Character does not belong to user',
      { characterId, userId },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class CharacterNotAnimalException extends StoryException {
  constructor(characterId: string) {
    super(
      StoryErrorCode.CHARACTER_NOT_ANIMAL,
      'Character is not an animal character',
      { characterId },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class StoryGenerationException extends StoryException {
  constructor(message: string, details?: any) {
    super(
      StoryErrorCode.STORY_GENERATION_FAILED,
      message,
      details,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export class IllustrationGenerationException extends StoryException {
  constructor(message: string, details?: any) {
    super(
      StoryErrorCode.ILLUSTRATION_GENERATION_FAILED,
      message,
      details,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export class ImageGenerationException extends StoryException {
  constructor(message: string, details?: any) {
    super(
      StoryErrorCode.IMAGE_GENERATION_FAILED,
      message,
      details,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
