export interface StoryPage {
  illustrationDescription: string;
  story: string;
  image: string;
  pageNumber: number;
}

export interface Story {
  createdAt: Date;
  storyId: string;
  storyPrompt: string;
  title: string;
  pages: StoryPage[];
  usedSettings?: any;
}

export interface StoryResponsePage {
  page: number;
  text: string;
}
export interface StoryResponse {
  pages: StoryResponsePage[];
}

export const STORY_RESPONSE_FORMAT = {
  type: 'json_schema',
  json_schema: {
    name: 'StoryPages',
    schema: {
      type: 'object',
      properties: {
        pages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: {
                type: 'number',
                description: 'The page number of the story',
              },
              text: {
                type: 'string',
                description: 'The text content for this page of the story',
              },
            },
            required: ['page', 'text'],
            additionalProperties: false,
          },
        },
      },
      required: ['pages'],
      additionalProperties: false,
    },
  },
};

export const STORY_TITLE_FORMAT_GERMAN = {
  type: 'json_schema',
  json_schema: {
    name: 'StoryTitleGerman',
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Titel der Geschichte',
        },
      },
      required: ['title'],
      additionalProperties: false,
    },
  },
};

export const STORY_RESPONSE_FORMAT_GERMAN = {
  type: 'json_schema',
  json_schema: {
    name: 'StoryPagesGerman',
    schema: {
      type: 'object',
      properties: {
        pages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: {
                type: 'number',
                description: 'Seitennummer der Geschichte',
              },
              text: {
                type: 'string',
                description: 'Textinhalt der Seite der Geschichte',
              },
            },
            required: ['page', 'text'],
            additionalProperties: false,
          },
        },
      },
      required: ['pages'],
      additionalProperties: false,
    },
  },
};

export const STORY_RESPONSE_FORMAT_GERMAN_GEMINI = {
  type: 'object',
  properties: {
    StoryPagesGerman: {
      type: 'object',
      properties: {
        pages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: {
                type: 'number',
              },
              text: {
                type: 'string',
              },
            },
          },
        },
      },
    },
  },
};

export const STORY_ILLUSTRATION_RESPONSE_FORMAT = {
  type: 'json_schema',
  json_schema: {
    name: 'StoryIllustrations',
    schema: {
      type: 'object',
      properties: {
        illustrations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: {
                type: 'number',
                description: 'The page number of the illustration',
              },
              illustration: {
                type: 'string',
                description:
                  'The detailed description of the illustration for this page',
              },
            },
            required: ['page', 'illustration'],
            additionalProperties: false,
          },
        },
      },
      required: ['illustrations'],
      additionalProperties: false,
    },
  },
};

export const ILLUSTRATION_PROMPT_FORMAT = {
  type: 'json_schema',
  json_schema: {
    name: 'StoryPages',
    schema: {
      type: 'object',
      properties: {
        illustration: {
          type: 'string',
          description: 'A detailed description of the illustration to create',
        },
      },
      required: ['illustration'],
      additionalProperties: false,
    },
  },
};

export interface StoryCharacter {
  characterDescription: string;
  pages: number[];
}

export interface StoryCharacterResponse {
  characters: StoryCharacter[];
}

export const CHARACTER_DESCRIPTION_PROMPT_FORMAT = {
  type: 'json_schema',
  json_schema: {
    name: 'StoryCharacters',
    schema: {
      type: 'object',
      properties: {
        characters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              characterDescription: {
                type: 'string',
                description: 'The description of the character',
              },
              pages: {
                type: 'array',
                items: { type: 'number' },
                description: 'The pages where the character appears',
              },
            },
          },
        },
      },
      required: ['characters'],
      additionalProperties: false,
    },
  },
};

export type IllustrationResponse = {
  status: 'success' | 'error';
  data: {
    image?: string;
    page: number;
    description: string;
    story?: string;
    error?: string;
  };
};
