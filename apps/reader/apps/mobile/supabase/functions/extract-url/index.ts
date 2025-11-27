import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Readability } from 'https://esm.sh/@mozilla/readability@0.5.0';
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { url } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate URL
    let validatedUrl;
    try {
      validatedUrl = new URL(url);
      if (!['http:', 'https:'].includes(validatedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid URL format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Try Jina.ai Reader API for better extraction
    try {
      const jinaUrl = `https://r.jina.ai/${validatedUrl.toString()}`;
      const jinaResponse = await fetch(jinaUrl, {
        headers: {
          Accept: 'text/plain',
          'X-Return-Format': 'text',
        },
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });

      if (jinaResponse.ok) {
        const content = await jinaResponse.text();

        // Check if we got meaningful content (not just cookie banner)
        if (
          content &&
          content.length > 500 &&
          !content.toLowerCase().includes('cookies zustimmen') &&
          !content.toLowerCase().includes('cookie banner')
        ) {
          // Extract title from content (usually first line)
          const lines = content.split('\n').filter((line) => line.trim());
          const title = lines[0] || 'Untitled';
          const actualContent = lines.slice(1).join('\n\n');

          return new Response(
            JSON.stringify({
              title: title.substring(0, 200), // Limit title length
              content: actualContent || content,
              excerpt: actualContent.substring(0, 200),
              source: validatedUrl.toString(),
              domain: validatedUrl.hostname,
              author: '',
              publishDate: '',
              wordCount: content.split(/\s+/).length,
              readingTime: Math.ceil(content.split(/\s+/).length / 200),
              tags: [],
            }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      }
    } catch (jinaError) {
      console.log('Jina.ai extraction failed:', jinaError);
    }

    // Fallback to direct webpage fetch
    const response = await fetch(validatedUrl.toString(), {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch URL: ${response.status} ${response.statusText}` }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const html = await response.text();

    // Parse HTML and extract content
    const doc = new DOMParser().parseFromString(html, 'text/html');

    if (!doc) {
      return new Response(JSON.stringify({ error: 'Failed to parse HTML' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Try to remove common cookie banners and overlays
    const elementsToRemove = [
      // Cookie banners
      '[class*="cookie"]',
      '[id*="cookie"]',
      '[class*="consent"]',
      '[id*="consent"]',
      '[class*="gdpr"]',
      '[id*="gdpr"]',
      '[class*="privacy"]',
      '[id*="privacy-banner"]',
      // Overlays
      '[class*="overlay"]',
      '[class*="modal"]',
      '[class*="popup"]',
      // Specific patterns
      '.cookie-banner',
      '#cookie-banner',
      '.privacy-banner',
      '#privacy-banner',
    ];

    elementsToRemove.forEach((selector) => {
      try {
        const elements = doc.querySelectorAll(selector);
        elements.forEach((el: any) => {
          // Only remove if it looks like a banner/overlay (not main content)
          const text = el.textContent || '';
          if (
            text.toLowerCase().includes('cookie') ||
            text.toLowerCase().includes('datenschutz') ||
            text.toLowerCase().includes('privacy') ||
            text.toLowerCase().includes('consent')
          ) {
            el.remove();
          }
        });
      } catch (e) {
        // Ignore selector errors
      }
    });

    // Use Readability to extract article content
    const reader = new Readability(doc);
    const article = reader.parse();

    if (!article) {
      // Fallback: Try to extract content manually
      let content = '';
      let title = '';

      // Try to find title
      const titleElement = doc.querySelector('h1') || doc.querySelector('title');
      if (titleElement) {
        title = titleElement.textContent?.trim() || '';
      }

      // Try to find main content areas
      const contentSelectors = [
        'main',
        'article',
        '[role="main"]',
        '.content',
        '#content',
        '.post',
        '.entry-content',
        '.article-content',
        '.main-content',
      ];

      for (const selector of contentSelectors) {
        const element = doc.querySelector(selector);
        if (element && element.textContent) {
          content = element.textContent.trim();
          break;
        }
      }

      // If still no content, get all paragraphs
      if (!content) {
        const paragraphs = doc.querySelectorAll('p');
        const texts: string[] = [];
        paragraphs.forEach((p: any) => {
          const text = p.textContent?.trim();
          if (text && text.length > 50) {
            // Filter out short paragraphs
            texts.push(text);
          }
        });
        content = texts.join('\n\n');
      }

      if (!content || content.length < 100) {
        return new Response(
          JSON.stringify({ error: 'Could not extract meaningful article content' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Create a pseudo-article object
      return new Response(
        JSON.stringify({
          title: title || 'Untitled',
          content: content,
          excerpt: content.substring(0, 200),
          source: validatedUrl.toString(),
          domain: validatedUrl.hostname,
          author: '',
          publishDate: '',
          wordCount: content.split(/\s+/).length,
          readingTime: Math.ceil(content.split(/\s+/).length / 200),
          tags: [],
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Extract additional metadata
    const metaTags = doc.querySelectorAll('meta');
    const metadata: Record<string, string> = {};

    metaTags.forEach((meta: any) => {
      const name = meta.getAttribute('name') || meta.getAttribute('property');
      const content = meta.getAttribute('content');

      if (name && content) {
        if (name.includes('author')) metadata.author = content;
        if (name.includes('description')) metadata.description = content;
        if (name.includes('keywords')) metadata.keywords = content;
        if (name.includes('publish')) metadata.publishDate = content;
      }
    });

    // Generate tags from keywords if available
    const tags = metadata.keywords
      ? metadata.keywords
          .split(',')
          .map((k) => k.trim())
          .filter((k) => k.length > 0)
          .slice(0, 5)
      : [];

    // Clean and format the extracted text
    const cleanedContent = article.textContent
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return new Response(
      JSON.stringify({
        title: article.title || 'Untitled',
        content: cleanedContent,
        excerpt: article.excerpt || metadata.description || '',
        source: validatedUrl.toString(),
        domain: validatedUrl.hostname,
        author: article.byline || metadata.author || '',
        publishDate: metadata.publishDate || '',
        wordCount: cleanedContent.split(/\s+/).length,
        readingTime: Math.ceil(cleanedContent.split(/\s+/).length / 200), // Assuming 200 words per minute
        tags,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Extract URL error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
