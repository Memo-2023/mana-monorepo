import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importiere die Übersetzungsdateien
import de from './translations/de.json';
import en from './translations/en.json';
import it from './translations/it.json';
import fr from './translations/fr.json';
import es from './translations/es.json';
import nl from './translations/nl.json';
import sv from './translations/sv.json';
import da from './translations/da.json';
import fi from './translations/fi.json';
import cs from './translations/cs.json';
import pl from './translations/pl.json';
import uk from './translations/uk.json';
import sr from './translations/sr.json';
import hr from './translations/hr.json';
import hu from './translations/hu.json';
import el from './translations/el.json';
import lt from './translations/lt.json';
import lv from './translations/lv.json';
import sk from './translations/sk.json';
import sl from './translations/sl.json';
import ro from './translations/ro.json';
import pt from './translations/pt.json';
import mt from './translations/mt.json';
import bg from './translations/bg.json';
import et from './translations/et.json';
import ga from './translations/ga.json';
import zh from './translations/zh.json';
import ru from './translations/ru.json';
import ko from './translations/ko.json';
import ja from './translations/ja.json';
import tr from './translations/tr.json';
import ar from './translations/ar.json';
import hi from './translations/hi.json';
import bn from './translations/bn.json';
import ur from './translations/ur.json';
import id from './translations/id.json';
import fa from './translations/fa.json';
import vi from './translations/vi.json';
import ptBR from './translations/pt-BR.json';
import esMX from './translations/es-MX.json';
import th from './translations/th.json';
import tl from './translations/tl.json';
import ms from './translations/ms.json';
import he from './translations/he.json';
import af from './translations/af.json';

// Definiere die unterstützten Sprachen
export const LANGUAGES = {
  de: { nativeName: 'Deutsch', emoji: '🇩🇪' },
  ch: { nativeName: 'Schwizerdütsch', emoji: '🇨🇭' },
  at: { nativeName: 'Österreichisch', emoji: '🇦🇹' },
  en: { nativeName: 'English', emoji: '🇬🇧' },
  nb: { nativeName: 'Norsk', emoji: '🇳🇴' },
  it: { nativeName: 'Italiano', emoji: '🇮🇹' },
  fr: { nativeName: 'Français', emoji: '🇫🇷' },
  es: { nativeName: 'Español', emoji: '🇪🇸' },
  'es-MX': { nativeName: 'Español (México)', emoji: '🇲🇽' },
  nl: { nativeName: 'Nederlands', emoji: '🇳🇱' },
  sv: { nativeName: 'Svenska', emoji: '🇸🇪' },
  da: { nativeName: 'Dansk', emoji: '🇩🇰' },
  fi: { nativeName: 'Suomi', emoji: '🇫🇮' },
  cs: { nativeName: 'Čeština', emoji: '🇨🇿' },
  pl: { nativeName: 'Polski', emoji: '🇵🇱' },
  uk: { nativeName: 'Українська', emoji: '🇺🇦' },
  sr: { nativeName: 'Српски', emoji: '🇷🇸' },
  hr: { nativeName: 'Hrvatski', emoji: '🇭🇷' },
  hu: { nativeName: 'Magyar', emoji: '🇭🇺' },
  el: { nativeName: 'Ελληνικά', emoji: '🇬🇷' },
  lt: { nativeName: 'Lietuvių', emoji: '🇱🇹' },
  lv: { nativeName: 'Latviešu', emoji: '🇱🇻' },
  sk: { nativeName: 'Slovenčina', emoji: '🇸🇰' },
  sl: { nativeName: 'Slovenščina', emoji: '🇸🇮' },
  ro: { nativeName: 'Română', emoji: '🇷🇴' },
  pt: { nativeName: 'Português', emoji: '🇵🇹' },
  'pt-BR': { nativeName: 'Português (Brasil)', emoji: '🇧🇷' },
  mt: { nativeName: 'Malti', emoji: '🇲🇹' },
  bg: { nativeName: 'Български', emoji: '🇧🇬' },
  et: { nativeName: 'Eesti', emoji: '🇪🇪' },
  ga: { nativeName: 'Gaeilge', emoji: '🇮🇪' },
  zh: { nativeName: '中文', emoji: '🇨🇳' },
  ru: { nativeName: 'Русский', emoji: '🇷🇺' },
  ko: { nativeName: '한국어', emoji: '🇰🇷' },
  ja: { nativeName: '日本語', emoji: '🇯🇵' },
  tr: { nativeName: 'Türkçe', emoji: '🇹🇷' },
  ar: { nativeName: 'العربية', emoji: '🇦🇪' },
  hi: { nativeName: 'हिन्दी', emoji: '🇮🇳' },
  bn: { nativeName: 'বাংলা', emoji: '🇧🇩' },
  ur: { nativeName: 'اردو', emoji: '🇵🇰' },
  id: { nativeName: 'Bahasa Indonesia', emoji: '🇮🇩' },
  fa: { nativeName: 'فارسی', emoji: '🇮🇷' },
  vi: { nativeName: 'Tiếng Việt', emoji: '🇻🇳' },
  th: { nativeName: 'ไทย', emoji: '🇹🇭' },
  tl: { nativeName: 'Filipino', emoji: '🇵🇭' },
  ms: { nativeName: 'Bahasa Melayu', emoji: '🇲🇾' },
  he: { nativeName: 'עברית', emoji: '🇮🇱' },
  af: { nativeName: 'Afrikaans', emoji: '🇿🇦' }
};

// Konstante für den AsyncStorage-Schlüssel
const LANGUAGE_STORAGE_KEY = 'memoro_language';

// Funktion zum Abrufen der gespeicherten Sprache
export const getStoredLanguage = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch (error) {
    console.debug('Error getting stored language:', error);
    return null;
  }
};

// Funktion zum Speichern der ausgewählten Sprache
export const storeLanguage = async (language: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.debug('Error storing language:', error);
  }
};

// Funktion zum Ändern der Sprache
export const changeLanguage = async (language: string): Promise<void> => {
  await i18n.changeLanguage(language);
  await storeLanguage(language);
};

// Initialisiere i18next mit den Übersetzungen sofort
// Dies stellt sicher, dass die Instanz bereits existiert, bevor Komponenten versuchen, sie zu verwenden
i18n
  .use(initReactI18next)
  .init({
    resources: {
      de: { translation: de },
      en: { translation: en },
      it: { translation: it },
      fr: { translation: fr },
      es: { translation: es },
      'es-MX': { translation: esMX },
      nl: { translation: nl },
      sv: { translation: sv },
      da: { translation: da },
      fi: { translation: fi },
      cs: { translation: cs },
      pl: { translation: pl },
      uk: { translation: uk },
      sr: { translation: sr },
      hr: { translation: hr },
      hu: { translation: hu },
      el: { translation: el },
      lt: { translation: lt },
      lv: { translation: lv },
      sk: { translation: sk },
      sl: { translation: sl },
      ro: { translation: ro },
      pt: { translation: pt },
      'pt-BR': { translation: ptBR },
      mt: { translation: mt },
      bg: { translation: bg },
      et: { translation: et },
      ga: { translation: ga },
      zh: { translation: zh },
      ru: { translation: ru },
      ko: { translation: ko },
      ja: { translation: ja },
      tr: { translation: tr },
      ar: { translation: ar },
      hi: { translation: hi },
      bn: { translation: bn },
      ur: { translation: ur },
      id: { translation: id },
      fa: { translation: fa },
      vi: { translation: vi },
      th: { translation: th },
      tl: { translation: tl },
      ms: { translation: ms },
      he: { translation: he },
      af: { translation: af },
    },
    lng: 'en', // Standardsprache, wird später aktualisiert
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React kümmert sich bereits um XSS
    },
    compatibilityJSON: 'v4', // Aktualisiert auf v4 für Kompatibilität
    react: {
      useSuspense: false, // Verhindert Probleme mit React Suspense
    },
  });

// Funktion zur Initialisierung von i18n mit der korrekten Sprache
export const initializeI18n = async (): Promise<void> => {
  try {
    // Versuche, die gespeicherte Sprache zu laden
    const storedLanguage = await getStoredLanguage();
    
    // Wenn keine gespeicherte Sprache vorhanden ist, verwende die Gerätesprache
    const deviceLanguage = getLocales()[0]?.languageCode || 'en';
    
    // Überprüfe, ob die Gerätesprache unterstützt wird
    const fallbackLanguage = Object.keys(LANGUAGES).includes(deviceLanguage) 
      ? deviceLanguage 
      : 'en';
    
    // Aktualisiere die Sprache
    await i18n.changeLanguage(storedLanguage || fallbackLanguage);
  } catch (error) {
    console.debug('Error initializing i18n:', error);
    // Bei Fehler bleibt die Standardsprache (en) aktiv
  }
};

// Exportiere i18n für die Verwendung in der App
export default i18n;
