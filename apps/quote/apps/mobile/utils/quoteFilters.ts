import type { EnhancedQuote } from '@quote/shared';

export interface QuoteFilters {
  timePeriods: string[];
  sourceTypes: string[];
  categories: string[];
  authorEras: string[];
  special: string[];
}

/**
 * Filter quotes by time period (based on year)
 */
export function filterByTimePeriod(quotes: EnhancedQuote[], periods: string[]): EnhancedQuote[] {
  if (periods.length === 0) return quotes;

  return quotes.filter(quote => {
    if (!quote.year) return false;

    const year = quote.year;
    return periods.some(period => {
      switch (period) {
        case 'ancient':
          return year < 0;
        case 'medieval':
          return year >= 0 && year < 1500;
        case 'earlyModern':
          return year >= 1500 && year < 1800;
        case '19th':
          return year >= 1800 && year < 1900;
        case 'early20th':
          return year >= 1900 && year < 1950;
        case 'late20th':
          return year >= 1950 && year < 2000;
        case '21st':
          return year >= 2000;
        default:
          return false;
      }
    });
  });
}

/**
 * Filter quotes by source type
 */
export function filterBySourceType(quotes: EnhancedQuote[], sourceTypes: string[]): EnhancedQuote[] {
  if (sourceTypes.length === 0) return quotes;

  return quotes.filter(quote => {
    if (!quote.source) return false;

    const source = quote.source.toLowerCase();

    return sourceTypes.some(type => {
      switch (type) {
        case 'books':
          // Exclude specific keywords that indicate other types
          return !source.includes('brief') &&
                 !source.includes('letter') &&
                 !source.includes('rede') &&
                 !source.includes('speech') &&
                 !source.includes('interview') &&
                 !source.includes('zugeschrieben') &&
                 !source.includes('attributed') &&
                 !source.includes('volksweisheit') &&
                 !source.includes('folk wisdom');
        case 'letters':
          return source.includes('brief') || source.includes('letter');
        case 'speeches':
          return source.includes('rede') || source.includes('speech');
        case 'interviews':
          return source.includes('interview');
        case 'attributed':
          return source.includes('zugeschrieben') || source.includes('attributed');
        case 'folkWisdom':
          return source.includes('volksweisheit') || source.includes('folk wisdom');
        case 'verified':
          return !source.includes('zugeschrieben') && !source.includes('attributed');
        default:
          return false;
      }
    });
  });
}

/**
 * Filter quotes by categories
 */
export function filterByCategories(quotes: EnhancedQuote[], categories: string[]): EnhancedQuote[] {
  if (categories.length === 0) return quotes;

  return quotes.filter(quote => {
    if (!quote.categories || quote.categories.length === 0) {
      // Also check single category field
      if (!quote.category) return false;
      return categories.includes(quote.category);
    }

    return quote.categories.some(cat => categories.includes(cat));
  });
}

/**
 * Filter quotes by author era (requires author data)
 */
export function filterByAuthorEra(quotes: EnhancedQuote[], eras: string[]): EnhancedQuote[] {
  if (eras.length === 0) return quotes;

  return quotes.filter(quote => {
    if (!quote.author?.era) return false;

    const authorEra = quote.author.era.toLowerCase();

    return eras.some(era => {
      switch (era) {
        case 'ancient':
          return authorEra.includes('antike') || authorEra.includes('ancient');
        case 'medieval':
          return authorEra.includes('mittelalter') || authorEra.includes('medieval');
        case 'earlyModern':
          return authorEra.includes('frühe neuzeit') || authorEra.includes('early modern');
        case '19th':
          return authorEra.includes('19.') || authorEra.includes('nineteenth');
        case '20th':
          return authorEra.includes('20.') || authorEra.includes('twentieth');
        case '21st':
          return authorEra.includes('21.') || authorEra.includes('twenty-first');
        default:
          return false;
      }
    });
  });
}

/**
 * Filter quotes by special criteria
 */
export function filterBySpecial(quotes: EnhancedQuote[], special: string[]): EnhancedQuote[] {
  if (special.length === 0) return quotes;

  return quotes.filter(quote => {
    return special.every(criterion => {
      switch (criterion) {
        case 'featured':
          return quote.featured === true;
        case 'hasYear':
          return quote.year !== undefined && quote.year !== null;
        case 'hasSource':
          return quote.source !== undefined && quote.source !== null;
        case 'verified':
          return quote.source &&
                 !quote.source.toLowerCase().includes('zugeschrieben') &&
                 !quote.source.toLowerCase().includes('attributed');
        case 'long':
          return quote.text.length > 150;
        case 'short':
          return quote.text.length < 100;
        default:
          return true;
      }
    });
  });
}

/**
 * Main filter function - applies all active filters
 */
export function filterQuotes(quotes: EnhancedQuote[], filters: QuoteFilters): EnhancedQuote[] {
  let filtered = quotes;

  // Apply each filter category
  filtered = filterByTimePeriod(filtered, filters.timePeriods);
  filtered = filterBySourceType(filtered, filters.sourceTypes);
  filtered = filterByCategories(filtered, filters.categories);
  filtered = filterByAuthorEra(filtered, filters.authorEras);
  filtered = filterBySpecial(filtered, filters.special);

  return filtered;
}

/**
 * Helper to check if any filters are active
 */
export function hasActiveFilters(filters: QuoteFilters): boolean {
  return Object.values(filters).some(arr => arr.length > 0);
}

/**
 * Helper to count active filters
 */
export function countActiveFilters(filters: QuoteFilters): number {
  return Object.values(filters).reduce((sum, arr) => sum + arr.length, 0);
}
