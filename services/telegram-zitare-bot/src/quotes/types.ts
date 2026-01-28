export interface Quote {
	id: string;
	text: string;
	authorId: string;
}

export interface Author {
	id: string;
	name: string;
	profession?: string[];
}

export interface QuoteWithAuthor {
	id: string;
	text: string;
	author: Author;
}
