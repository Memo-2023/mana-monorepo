export interface Story {
  id: string;
  title: string;
  content?: string;
  authorId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}