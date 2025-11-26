export interface ImageUrlWithPage {
  page: number;
  imageUrl: string;
  blurHash: string;
}

export interface ImageWithBlurHash {
  url: string;
  blurHash: string;
}

export interface Creator {
  type: 'illustrator' | 'author';
  name: string;
  systemPrompt: string;
  description: string;
  profilePicture?: string;
  extraPromptBeginning?: string;
  extraPromptEnd?: string;
  creatorId: string;
}

export interface ExtraPrompts {
  extraPromptBeginning: string;
  extraPromptEnd: string;
}
