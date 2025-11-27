import { supabase } from '~/utils/supabase';

export interface ExtractedContent {
  title: string;
  content: string;
  excerpt: string;
  source: string;
  domain: string;
  author: string;
  publishDate: string;
  wordCount: number;
  readingTime: number;
  tags: string[];
}

export interface ExtractUrlError {
  message: string;
  code?: 'INVALID_URL' | 'FETCH_FAILED' | 'EXTRACTION_FAILED' | 'NETWORK_ERROR' | 'UNAUTHORIZED';
}

class UrlExtractorService {
  async extractFromUrl(
    url: string
  ): Promise<{ data: ExtractedContent | null; error: ExtractUrlError | null }> {
    try {
      // Basic URL validation
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(url)) {
        return {
          data: null,
          error: {
            message: 'Bitte gib eine gültige URL ein (http:// oder https://)',
            code: 'INVALID_URL',
          },
        };
      }

      const { data, error } = await supabase.functions.invoke('extract-url', {
        body: { url },
      });

      if (error) {
        console.error('Error extracting URL:', error);

        // Handle specific error cases
        if (error.message?.includes('Unauthorized')) {
          return {
            data: null,
            error: {
              message: 'Nicht autorisiert. Bitte melde dich erneut an.',
              code: 'UNAUTHORIZED',
            },
          };
        }

        if (error.message?.includes('Failed to fetch URL')) {
          return {
            data: null,
            error: {
              message: 'Die Webseite konnte nicht geladen werden. Überprüfe die URL.',
              code: 'FETCH_FAILED',
            },
          };
        }

        if (error.message?.includes('Could not extract')) {
          return {
            data: null,
            error: {
              message:
                'Der Text konnte nicht extrahiert werden. Die Seite ist möglicherweise nicht kompatibel.',
              code: 'EXTRACTION_FAILED',
            },
          };
        }

        return {
          data: null,
          error: { message: error.message || 'Ein Fehler ist aufgetreten', code: 'NETWORK_ERROR' },
        };
      }

      if (!data) {
        return {
          data: null,
          error: { message: 'Keine Daten empfangen', code: 'EXTRACTION_FAILED' },
        };
      }

      return { data: data as ExtractedContent, error: null };
    } catch (error) {
      console.error('Unexpected error in extractFromUrl:', error);
      return {
        data: null,
        error: { message: 'Ein unerwarteter Fehler ist aufgetreten', code: 'NETWORK_ERROR' },
      };
    }
  }

  validateUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  formatExtractedContent(extracted: ExtractedContent): string {
    // Format the extracted content with title and metadata
    let formatted = extracted.title + '\n\n';

    if (extracted.author) {
      formatted += `Von: ${extracted.author}\n`;
    }

    if (extracted.publishDate) {
      formatted += `Veröffentlicht: ${extracted.publishDate}\n`;
    }

    if (extracted.domain) {
      formatted += `Quelle: ${extracted.domain}\n`;
    }

    formatted += '\n' + extracted.content;

    return formatted;
  }
}

export const urlExtractorService = new UrlExtractorService();
