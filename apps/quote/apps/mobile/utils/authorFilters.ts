import type { Author } from '@quote/shared';
import { AuthorFilters } from '~/components/authors/AuthorFilterSheet';

/**
 * Get the epoch/century for an author based on birth year
 */
export function getAuthorEpoch(author: Author): string[] {
  if (!author.lifespan?.birth) return [];

  const birthYear = new Date(author.lifespan.birth).getFullYear();
  const epochs: string[] = [];

  if (birthYear < 500) epochs.push('ancient');
  else if (birthYear >= 500 && birthYear < 1500) epochs.push('medieval');
  else if (birthYear >= 1500 && birthYear < 1800) epochs.push('earlyModern');
  else if (birthYear >= 1800 && birthYear < 1900) epochs.push('19th');
  else if (birthYear >= 1900 && birthYear < 2000) epochs.push('20th');
  else if (birthYear >= 2000) epochs.push('21st');

  // Check if still living
  if (!author.lifespan.death) {
    epochs.push('living');
  }

  return epochs;
}

/**
 * Get normalized profession keys for an author
 */
export function getAuthorProfessions(author: Author): string[] {
  if (!author.profession || author.profession.length === 0) return [];

  const professionMap: Record<string, string[]> = {
    philosopher: ['philosoph', 'philosopher', 'denker'],
    writer: ['schriftsteller', 'writer', 'autor', 'author', 'novelist', 'romanautor'],
    scientist: ['wissenschaftler', 'scientist', 'forscher', 'researcher', 'physiker', 'physicist', 'chemiker', 'chemist'],
    politician: ['politiker', 'politician', 'staatsmann', 'statesman', 'präsident', 'president'],
    artist: ['künstler', 'artist', 'maler', 'painter', 'bildhauer', 'sculptor'],
    entrepreneur: ['unternehmer', 'entrepreneur', 'geschäftsmann', 'businessman'],
    poet: ['dichter', 'poet', 'lyriker'],
    activist: ['aktivist', 'activist', 'bürgerrechtler'],
  };

  const professions = new Set<string>();

  author.profession.forEach(prof => {
    const normalized = prof.toLowerCase();
    for (const [key, variants] of Object.entries(professionMap)) {
      if (variants.some(variant => normalized.includes(variant))) {
        professions.add(key);
      }
    }
  });

  return Array.from(professions);
}

/**
 * Get normalized nationality keys for an author
 */
export function getAuthorNationalities(author: Author): string[] {
  if (!author.nationality) return [];

  const nationalities = Array.isArray(author.nationality)
    ? author.nationality
    : [author.nationality];

  const nationalityMap: Record<string, string[]> = {
    german: ['deutsch', 'german', 'germany', 'deutschland'],
    american: ['amerikanisch', 'american', 'usa', 'us'],
    british: ['britisch', 'british', 'englisch', 'english', 'uk', 'england'],
    french: ['französisch', 'french', 'france', 'frankreich'],
    italian: ['italienisch', 'italian', 'italy', 'italien'],
    spanish: ['spanisch', 'spanish', 'spain', 'spanien'],
    greek: ['griechisch', 'greek', 'greece', 'griechenland'],
    roman: ['römisch', 'roman', 'rome', 'rom'],
  };

  const result = new Set<string>();

  nationalities.forEach(nat => {
    const normalized = nat.toLowerCase();
    for (const [key, variants] of Object.entries(nationalityMap)) {
      if (variants.some(variant => normalized.includes(variant))) {
        result.add(key);
      }
    }
  });

  return Array.from(result);
}

/**
 * Get quote count category for an author
 */
export function getAuthorQuoteCountCategory(author: Author): string {
  const count = author.quoteIds?.length || 0;

  if (count <= 5) return 'few';
  if (count <= 15) return 'medium';
  if (count <= 50) return 'many';
  return 'verymany';
}

/**
 * Check if author matches special filters
 */
export function matchesSpecialFilters(author: Author, filters: string[]): boolean {
  for (const filter of filters) {
    switch (filter) {
      case 'verified':
        if (!author.verified) return false;
        break;
      case 'featured':
        if (!author.featured) return false;
        break;
      case 'hasImage':
        if (!author.image?.thumbnail && !author.image?.full) return false;
        break;
      case 'hasBio':
        if (!author.biography?.long && (!author.biography?.short || author.biography.short.length < 50)) return false;
        break;
    }
  }
  return true;
}

/**
 * Apply all filters to an author
 */
export function applyFiltersToAuthor(author: Author, filters: AuthorFilters): boolean {
  // Epoch filter
  if (filters.epochs.length > 0) {
    const authorEpochs = getAuthorEpoch(author);
    if (!filters.epochs.some(epoch => authorEpochs.includes(epoch))) {
      return false;
    }
  }

  // Profession filter
  if (filters.professions.length > 0) {
    const authorProfessions = getAuthorProfessions(author);
    if (!filters.professions.some(prof => authorProfessions.includes(prof))) {
      return false;
    }
  }

  // Nationality filter
  if (filters.nationalities.length > 0) {
    const authorNationalities = getAuthorNationalities(author);
    if (!filters.nationalities.some(nat => authorNationalities.includes(nat))) {
      return false;
    }
  }

  // Quote count filter
  if (filters.quoteCount.length > 0) {
    const authorQuoteCount = getAuthorQuoteCountCategory(author);
    if (!filters.quoteCount.includes(authorQuoteCount)) {
      return false;
    }
  }

  // Special filters
  if (filters.special.length > 0) {
    if (!matchesSpecialFilters(author, filters.special)) {
      return false;
    }
  }

  return true;
}

/**
 * Filter authors list based on active filters
 */
export function filterAuthors(authors: Author[], filters: AuthorFilters): Author[] {
  // If no filters are active, return all authors
  const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0);
  if (!hasActiveFilters) return authors;

  return authors.filter(author => applyFiltersToAuthor(author, filters));
}
