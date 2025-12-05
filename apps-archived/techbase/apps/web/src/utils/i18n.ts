import { i18nConfig } from '../content/config';

export function getLocalizedUrl(path: string, locale: string) {
  return `/${locale}${path.startsWith('/') ? path : '/' + path}`;
}

export function getLocaleFromUrl(url: URL) {
  const [, locale] = url.pathname.split('/');
  if (i18nConfig.locales.includes(locale)) {
    return locale;
  }
  return i18nConfig.defaultLocale;
}

export async function loadTranslations(locale: string) {
  const translations = await import(`../content/translations/${locale}.json`);
  return translations.default;
}