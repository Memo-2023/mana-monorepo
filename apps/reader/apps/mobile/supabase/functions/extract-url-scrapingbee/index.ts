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

    // Use ScrapingBee API - requires API key in environment
    const scrapingBeeApiKey = Deno.env.get('SCRAPINGBEE_API_KEY');
    if (!scrapingBeeApiKey) {
      console.error('SCRAPINGBEE_API_KEY not configured, falling back to direct fetch');
      // Fallback to direct fetch if API key not configured
      return fallbackExtraction(validatedUrl, corsHeaders);
    }

    // ScrapingBee API request
    const scrapingBeeUrl = new URL('https://app.scrapingbee.com/api/v1/');
    scrapingBeeUrl.searchParams.append('api_key', scrapingBeeApiKey);
    scrapingBeeUrl.searchParams.append('url', validatedUrl.toString());
    scrapingBeeUrl.searchParams.append('render_js', 'true'); // Render JavaScript
    scrapingBeeUrl.searchParams.append('wait', '3000'); // Wait 3s for content to load
    scrapingBeeUrl.searchParams.append('block_ads', 'true'); // Block ads
    scrapingBeeUrl.searchParams.append('stealth_mode', 'true'); // Bypass anti-bot measures

    // Custom JavaScript to remove cookie banners
    const jsScript = `
      // Remove cookie banners
      const selectors = [
        '[class*="cookie"]', '[id*="cookie"]',
        '[class*="consent"]', '[id*="consent"]',
        '[class*="gdpr"]', '[id*="gdpr"]',
        '.privacy-banner', '#privacy-banner'
      ];
      selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          if (el.textContent.toLowerCase().includes('cookie') || 
              el.textContent.toLowerCase().includes('consent')) {
            el.remove();
          }
        });
      });
      // Click accept buttons if needed
      const acceptButtons = document.querySelectorAll('button, a');
      acceptButtons.forEach(btn => {
        const text = btn.textContent.toLowerCase();
        if ((text.includes('accept') || text.includes('akzeptieren')) && 
            (text.includes('cookie') || text.includes('all'))) {
          btn.click();
        }
      });
    `;
    scrapingBeeUrl.searchParams.append('js_scenario', btoa(jsScript));

    const response = await fetch(scrapingBeeUrl.toString());

    if (!response.ok) {
      console.error('ScrapingBee error:', response.status, await response.text());
      return fallbackExtraction(validatedUrl, corsHeaders);
    }

    const html = await response.text();

    // Parse and extract content
    const doc = new DOMParser().parseFromString(html, 'text/html');

    if (!doc) {
      return new Response(JSON.stringify({ error: 'Failed to parse HTML' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use Readability to extract article content
    const reader = new Readability(doc);
    const article = reader.parse();

    if (!article || article.textContent.length < 200) {
      // Try manual extraction
      return manualExtraction(doc, validatedUrl, corsHeaders);
    }

    // Extract metadata
    const metadata = extractMetadata(doc);
    const tags = generateTags(metadata.keywords);

    // Clean content
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
        readingTime: Math.ceil(cleanedContent.split(/\s+/).length / 200),
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

// Helper functions
async function fallbackExtraction(url: URL, corsHeaders: any) {
  // Original extraction logic as fallback
  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  if (!response.ok) {
    return new Response(JSON.stringify({ error: `Failed to fetch URL: ${response.status}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const html = await response.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');

  return manualExtraction(doc!, url, corsHeaders);
}

function manualExtraction(doc: any, url: URL, corsHeaders: any) {
  let content = '';
  let title = '';

  // Find title
  const titleElement = doc.querySelector('h1') || doc.querySelector('title');
  if (titleElement) {
    title = titleElement.textContent?.trim() || '';
  }

  // Find content
  const contentSelectors = [
    'main',
    'article',
    '[role="main"]',
    '.content',
    '#content',
    '.post',
    '.entry-content',
    '.article-content',
  ];

  for (const selector of contentSelectors) {
    const element = doc.querySelector(selector);
    if (element && element.textContent) {
      content = element.textContent.trim();
      break;
    }
  }

  // Get paragraphs
  if (!content || content.length < 200) {
    const paragraphs = doc.querySelectorAll('p');
    const texts: string[] = [];
    paragraphs.forEach((p: any) => {
      const text = p.textContent?.trim();
      if (text && text.length > 50) {
        texts.push(text);
      }
    });
    content = texts.join('\n\n');
  }

  if (!content || content.length < 100) {
    return new Response(JSON.stringify({ error: 'Could not extract meaningful content' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      title: title || 'Untitled',
      content: content,
      excerpt: content.substring(0, 200),
      source: url.toString(),
      domain: url.hostname,
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

function extractMetadata(doc: any) {
  const metadata: Record<string, string> = {};
  const metaTags = doc.querySelectorAll('meta');

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

  return metadata;
}

function generateTags(keywords?: string): string[] {
  if (!keywords) return [];
  return keywords
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k.length > 0)
    .slice(0, 5);
}
