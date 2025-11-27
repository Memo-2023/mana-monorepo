export interface Deck {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  sharing: DeckSharing;
}

export type CollaboratorRole = 'viewer' | 'editor';

export interface DeckSharing {
  isPublic: boolean;
  collaborators: {
    [userId: string]: CollaboratorRole;
  };
  shareLink?: string;
  expiresAt?: Date;
}

export interface Slide {
  id: string;
  deckId: string;
  order: number;
  imageUrl?: string;
  title: string;
  fullText?: string;
  summary?: string;
  bulletPoints?: string[];
  notes?: string;
  altText?: string;
  createdAt: Date;
  updatedAt: Date;
}