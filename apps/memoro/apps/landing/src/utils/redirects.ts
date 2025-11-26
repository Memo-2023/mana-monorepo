/**
 * Redirect Map für alte URLs
 * Format: 'alte-url': 'neue-url'
 * 
 * Nach der Umstellung: ALLE URLs haben jetzt Sprachpräfixe!
 * - Deutsche URLs: /de/...
 * - Englische URLs: /en/...
 */

export const redirectMap: Record<string, string> = {
  // Alte URLs ohne Sprachpräfix -> Deutsche Version
  '/features': '/de/features',
  '/prices': '/de/prices',
  '/download': '/de/download',
  '/blog': '/de/blog',
  '/team': '/de/team',
  '/about': '/de/about',
  '/contact': '/de/contact',
  '/testimonials': '/de/testimonials',
  '/industries': '/de/industries',
  '/guides': '/de/guides',
  '/memories': '/de/memories',
  '/blueprints': '/de/blueprints',
  '/changelog': '/de/changelog',
  '/faq': '/de/faq',
  '/imprint': '/de/imprint',
  '/privacy': '/de/privacy',
  '/terms': '/de/terms',
  '/wallpapers': '/de/wallpapers',
  '/statistics': '/de/statistics',
  '/presskit': '/de/presskit',
  '/screenshots-demo': '/de/screenshots-demo',
  
  // Spezielle deutsche Seiten
  '/meeting-protokoll-software': '/de/meeting-protokoll-software',
  
  // Industry-spezifische alte URLs
  '/industries/education': '/de/industries/education',
  '/industries/construction': '/de/industries/construction', 
  '/industries/office': '/de/industries/office',
  '/bildung': '/de/industries/education',
  '/bau': '/de/industries/construction',
  '/buero': '/de/industries/office',
  
  // Feature-spezifische alte URLs
  '/features/recording': '/de/features/recording',
  '/features/sharing': '/de/features/sharing',
  '/features/translate': '/de/features/translate',
  '/funktionen': '/de/features',
  '/aufnahme': '/de/features/recording',
  
  // Alte Blog-URLs
  '/blog/memoro-2-0-release': '/de/blog/de/memoro-2-0-release',
  '/blog/ki-als-persoenlicher-assistent': '/de/blog/de/ki-als-persoenlicher-assistent',
  
  // Privacy-spezifische URLs
  '/privacy/app': '/de/privacy/app',
  '/privacy/website': '/de/privacy/website',
  '/privacy/security': '/de/privacy/security',
  '/privacy/terms': '/de/privacy/terms',
  '/datenschutz': '/de/privacy',
  '/impressum': '/de/imprint',
  '/agb': '/de/terms',
  
  // Common typos and variations
  '/feature': '/de/features',
  '/price': '/de/prices',
  '/kontakt': '/de/contact',
  '/ueber-uns': '/de/about',
  '/hilfe': '/de/contact',
  '/support': '/de/contact',
  '/downloads': '/de/download',
  '/app': '/de/download',
  
  // Legacy URLs
  '/home': '/de',
  '/start': '/de',
  '/startseite': '/de',
  '/index': '/de',
  
  // English variations (for users who type English URLs)
  '/pricing': '/en/prices',
  '/about-us': '/en/about',
  '/help': '/en/contact',
  '/legal': '/en/imprint',
  '/privacy-policy': '/en/privacy',
  '/terms-of-service': '/en/terms',
};

/**
 * Prüft ob eine URL eine Weiterleitung benötigt
 * @param pathname Die zu prüfende URL
 * @returns Die Ziel-URL oder null wenn keine Weiterleitung nötig
 */
export function getRedirectUrl(pathname: string): string | null {
  // Normalisiere den Pfad (entferne trailing slash außer bei Root)
  const normalizedPath = pathname.length > 1 && pathname.endsWith('/') 
    ? pathname.slice(0, -1) 
    : pathname;
  
  // Prüfe ob eine direkte Weiterleitung existiert
  if (redirectMap[normalizedPath]) {
    return redirectMap[normalizedPath];
  }
  
  // Prüfe case-insensitive (für häufige Fehler)
  const lowerPath = normalizedPath.toLowerCase();
  const matchingKey = Object.keys(redirectMap).find(
    key => key.toLowerCase() === lowerPath
  );
  
  if (matchingKey) {
    return redirectMap[matchingKey];
  }
  
  return null;
}

/**
 * Gibt den HTTP-Statuscode für die Weiterleitung zurück
 * 301 = Permanent (für SEO)
 * 302 = Temporär
 */
export function getRedirectStatus(pathname: string): number {
  // Alle Weiterleitungen sind permanent für SEO
  return 301;
}