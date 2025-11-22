import type { Language } from './config';
import { defaultLang } from './config';

// Get route without language prefix
export function getRouteFromUrl(url: URL): string {
  const pathname = url.pathname;
  const parts = pathname.split('/');

  // Check if first part is a language code
  if (parts[1] === 'en' || parts[1] === 'it' || parts[1] === 'fr' || parts[1] === 'es') {
    parts.splice(1, 1);
  }

  return parts.join('/') || '/';
}

// Get localized route
export function getLocalizedRoute(route: string, lang: Language): string {
  if (lang === defaultLang) {
    return route;
  }
  return `/${lang}${route}`;
}

// Get alternate language links for SEO
export function getAlternateLinks(currentRoute: string) {
  return [
    { lang: 'de', href: currentRoute },
    { lang: 'en', href: `/en${currentRoute}` },
    { lang: 'it', href: `/it${currentRoute}` },
    { lang: 'fr', href: `/fr${currentRoute}` },
    { lang: 'es', href: `/es${currentRoute}` },
  ];
}

// Get browser language preference
export function getBrowserLang(): Language {
  if (typeof window === 'undefined') return defaultLang;

  const browserLang = navigator.language.split('-')[0];
  if (browserLang === 'de' || browserLang === 'en' || browserLang === 'it' || browserLang === 'fr' || browserLang === 'es') {
    return browserLang as Language;
  }

  return defaultLang;
}

// Format date based on locale
export function formatDate(date: Date, lang: Language): string {
  const locales: Record<Language, string> = {
    de: 'de-DE',
    en: 'en-US',
    it: 'it-IT',
    fr: 'fr-FR',
    es: 'es-ES'
  };

  return new Intl.DateTimeFormat(locales[lang], {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

// Format number based on locale
export function formatNumber(num: number, lang: Language): string {
  const locales: Record<Language, string> = {
    de: 'de-DE',
    en: 'en-US',
    it: 'it-IT',
    fr: 'fr-FR',
    es: 'es-ES'
  };

  return new Intl.NumberFormat(locales[lang]).format(num);
}

// Format currency based on locale
export function formatCurrency(amount: number, lang: Language, currency = 'EUR'): string {
  const locales: Record<Language, string> = {
    de: 'de-DE',
    en: 'en-US',
    it: 'it-IT',
    fr: 'fr-FR',
    es: 'es-ES'
  };

  return new Intl.NumberFormat(locales[lang], {
    style: 'currency',
    currency: currency
  }).format(amount);
}