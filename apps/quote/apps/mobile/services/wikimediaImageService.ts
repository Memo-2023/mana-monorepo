export interface WikimediaImageInfo {
  url: string;
  title: string;
  user: string;
  width: number;
  height: number;
  size: number;
}

export interface WikimediaSearchResult {
  title: string;
  imageInfo?: WikimediaImageInfo;
  found: boolean;
  error?: string;
}

export class WikimediaImageService {
  private static readonly API_BASE = 'https://commons.wikimedia.org/w/api.php';
  private static readonly WIKIPEDIA_API_BASE = 'https://en.wikipedia.org/w/api.php';

  /**
   * Search for an author's image on Wikimedia Commons
   */
  static async searchAuthorImage(authorName: string): Promise<WikimediaSearchResult> {
    try {
      // First, try to find the Wikipedia page for the author
      const wikipediaPage = await this.findWikipediaPage(authorName);
      
      if (!wikipediaPage) {
        return {
          title: authorName,
          found: false,
          error: 'Wikipedia page not found'
        };
      }

      // Get images from the Wikipedia page
      const images = await this.getWikipediaPageImages(wikipediaPage);
      
      if (images.length === 0) {
        return {
          title: authorName,
          found: false,
          error: 'No images found on Wikipedia page'
        };
      }

      // Get the first suitable image (usually the main portrait)
      const mainImage = images.find(img => 
        img.title.toLowerCase().includes('.jpg') || 
        img.title.toLowerCase().includes('.jpeg') ||
        img.title.toLowerCase().includes('.png')
      ) || images[0];

      const imageInfo = await this.getImageInfo(mainImage.title);
      
      return {
        title: authorName,
        imageInfo,
        found: !!imageInfo
      };

    } catch (error) {
      console.error(`Error searching for ${authorName} image:`, error);
      return {
        title: authorName,
        found: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Find Wikipedia page title for an author
   */
  private static async findWikipediaPage(authorName: string): Promise<string | null> {
    const searchUrl = new URL(this.WIKIPEDIA_API_BASE);
    searchUrl.searchParams.set('action', 'query');
    searchUrl.searchParams.set('list', 'search');
    searchUrl.searchParams.set('srsearch', authorName);
    searchUrl.searchParams.set('srlimit', '5');
    searchUrl.searchParams.set('format', 'json');
    searchUrl.searchParams.set('origin', '*');

    const response = await fetch(searchUrl.toString());
    const data = await response.json();

    if (data.query?.search?.length > 0) {
      // Return the first search result title
      return data.query.search[0].title;
    }

    return null;
  }

  /**
   * Get images from a Wikipedia page
   */
  private static async getWikipediaPageImages(pageTitle: string): Promise<{title: string}[]> {
    const imagesUrl = new URL(this.WIKIPEDIA_API_BASE);
    imagesUrl.searchParams.set('action', 'query');
    imagesUrl.searchParams.set('titles', pageTitle);
    imagesUrl.searchParams.set('prop', 'images');
    imagesUrl.searchParams.set('imlimit', '10');
    imagesUrl.searchParams.set('format', 'json');
    imagesUrl.searchParams.set('origin', '*');

    const response = await fetch(imagesUrl.toString());
    const data = await response.json();

    const pages = data.query?.pages || {};
    const pageId = Object.keys(pages)[0];
    
    if (pageId && pages[pageId]?.images) {
      return pages[pageId].images;
    }

    return [];
  }

  /**
   * Get detailed information about a specific image
   */
  private static async getImageInfo(imageTitle: string): Promise<WikimediaImageInfo | null> {
    const imageInfoUrl = new URL(this.API_BASE);
    imageInfoUrl.searchParams.set('action', 'query');
    imageInfoUrl.searchParams.set('titles', imageTitle);
    imageInfoUrl.searchParams.set('prop', 'imageinfo');
    imageInfoUrl.searchParams.set('iiprop', 'url|user|size|dimensions');
    imageInfoUrl.searchParams.set('iiurlwidth', '300'); // Get a reasonable thumbnail size
    imageInfoUrl.searchParams.set('format', 'json');
    imageInfoUrl.searchParams.set('origin', '*');

    const response = await fetch(imageInfoUrl.toString());
    const data = await response.json();

    const pages = data.query?.pages || {};
    const pageId = Object.keys(pages)[0];
    
    if (pageId && pages[pageId]?.imageinfo?.[0]) {
      const info = pages[pageId].imageinfo[0];
      return {
        url: info.thumburl || info.url,
        title: imageTitle,
        user: info.user || 'Unknown',
        width: info.width || 0,
        height: info.height || 0,
        size: info.size || 0
      };
    }

    return null;
  }

  /**
   * Batch search for multiple authors
   */
  static async searchMultipleAuthors(authorNames: string[]): Promise<WikimediaSearchResult[]> {
    const results: WikimediaSearchResult[] = [];
    
    // Process authors in batches to avoid overwhelming the API
    const batchSize = 3;
    for (let i = 0; i < authorNames.length; i += batchSize) {
      const batch = authorNames.slice(i, i + batchSize);
      const batchPromises = batch.map(name => this.searchAuthorImage(name));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add a small delay between batches to be respectful to the API
      if (i + batchSize < authorNames.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }
}