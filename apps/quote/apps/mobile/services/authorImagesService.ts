// @ts-ignore
import authorImagesData from '../author-images-all.json';

interface AuthorImageData {
	id: string;
	name: string;
	found: boolean;
	imageInfo?: {
		url: string;
		title: string;
		user: string;
		width: number;
		height: number;
		size: number;
	};
}

interface AuthorImagesFile {
	timestamp: string;
	totalAuthors: number;
	authors: AuthorImageData[];
}

const authorImages = authorImagesData as AuthorImagesFile;

// Create a map for quick lookup
const authorImageMap = new Map<string, string>();

authorImages.authors.forEach((author) => {
	if (author.found && author.imageInfo?.url) {
		authorImageMap.set(author.id, author.imageInfo.url);
	}
});

export function getAuthorImageUrl(authorId: string): string | undefined {
	return authorImageMap.get(authorId);
}

export function enrichAuthorWithImage<T extends { id: string }>(
	author: T
): T & { imageUrl?: string } {
	const imageUrl = getAuthorImageUrl(author.id);
	return imageUrl ? { ...author, imageUrl } : author;
}

export function enrichAuthorsWithImages<T extends { id: string }>(
	authors: T[]
): (T & { imageUrl?: string })[] {
	return authors.map((author) => enrichAuthorWithImage(author));
}
