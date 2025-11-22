import { ui, defaultLang } from './ui';

/**
 * Extracts language from URL or from lang parameter
 * Can be used both with URL objects and with string parameters
 */
export function getLangFromUrl(url: URL | string) {
  // Handle both URL objects and string parameters
  const pathname = typeof url === 'string' ? url : url.pathname;
  
  // Split path and get the first segment (language code)
  const [, lang] = pathname.split('/');
  
  // Check if it's a valid language code
  if (lang in ui) return lang as keyof typeof ui;
  
  // Return default language if no valid language found
  return defaultLang;
}

/**
 * Returns translation function for the specified language
 */
export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof typeof ui[typeof defaultLang]) {
    // Return the translation or fall back to default language if not found
    return ui[lang][key] || ui[defaultLang][key];
  }
}

/**
 * Creates a localized URL for the specified path and language
 */
export function localizeUrl(path: string, lang: keyof typeof ui) {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Extract segments and check if first segment is a language code
  const segments = cleanPath.split('/');
  const hasLangSegment = Object.keys(ui).includes(segments[0]);
  
  // If path already has a language segment, replace it
  if (hasLangSegment) {
    segments[0] = lang;
    return '/' + segments.join('/');
  }
  
  // Otherwise, add language segment
  return `/${lang}/${cleanPath}`;
}
