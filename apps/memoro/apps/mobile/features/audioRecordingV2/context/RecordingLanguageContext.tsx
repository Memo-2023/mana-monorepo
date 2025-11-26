import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LANGUAGES } from '~/features/i18n';

// Definiere den Typ für den Kontext
interface RecordingLanguageContextType {
  recordingLanguages: string[];
  addRecordingLanguage: (language: string) => Promise<void>;
  removeRecordingLanguage: (language: string) => Promise<void>;
  toggleRecordingLanguage: (language: string) => Promise<void>;
  supportedAzureLanguages: Record<string, { locale: string; nativeName: string; emoji: string }>;
  dialectChangeNotification: { oldDialect: string; newDialect: string } | null;
  clearDialectNotification: () => void;
}

// Konstante für den AsyncStorage-Schlüssel
const RECORDING_LANGUAGES_STORAGE_KEY = 'memoro_recording_languages';

// Azure unterstützte Sprachen mit ihren Locale-Codes
// ⚡ = Fast transcription support / 🐢 = Standard transcription only
export const AZURE_SUPPORTED_LANGUAGES = {
  auto: { locale: 'auto', nativeName: 'Auto', emoji: '🌐' },
  af: { locale: 'af-ZA', nativeName: LANGUAGES.af.nativeName + ' 🐢', emoji: LANGUAGES.af.emoji },
  ar: { locale: 'ar-SA', nativeName: LANGUAGES.ar.nativeName + ' ⚡', emoji: LANGUAGES.ar.emoji },
  'ar-AE': { locale: 'ar-AE', nativeName: 'العربية (الإمارات) 🐢', emoji: '🇦🇪' },
  'ar-EG': { locale: 'ar-EG', nativeName: 'العربية (مصر) 🐢', emoji: '🇪🇬' },
  at: { locale: 'de-AT', nativeName: LANGUAGES.at.nativeName + ' 🐢', emoji: LANGUAGES.at.emoji },
  bg: { locale: 'bg-BG', nativeName: LANGUAGES.bg.nativeName + ' 🐢', emoji: LANGUAGES.bg.emoji },
  bn: { locale: 'bn-IN', nativeName: LANGUAGES.bn.nativeName + ' 🐢', emoji: LANGUAGES.bn.emoji },
  ch: { locale: 'de-CH', nativeName: LANGUAGES.ch.nativeName + ' 🐢', emoji: LANGUAGES.ch.emoji },
  cs: { locale: 'cs-CZ', nativeName: LANGUAGES.cs.nativeName + ' 🐢', emoji: LANGUAGES.cs.emoji },
  da: { locale: 'da-DK', nativeName: LANGUAGES.da.nativeName + ' ⚡', emoji: LANGUAGES.da.emoji },
  de: { locale: 'de-DE', nativeName: LANGUAGES.de.nativeName + ' ⚡', emoji: LANGUAGES.de.emoji },
  el: { locale: 'el-GR', nativeName: LANGUAGES.el.nativeName + ' 🐢', emoji: LANGUAGES.el.emoji },
  en: { locale: 'en-US', nativeName: LANGUAGES.en.nativeName + ' ⚡', emoji: LANGUAGES.en.emoji },
  'en-GB': { locale: 'en-GB', nativeName: 'English (UK) ⚡', emoji: '🇬🇧' },
  'en-AU': { locale: 'en-AU', nativeName: 'English (Australia) 🐢', emoji: '🇦🇺' },
  'en-CA': { locale: 'en-CA', nativeName: 'English (Canada) 🐢', emoji: '🇨🇦' },
  'en-IN': { locale: 'en-IN', nativeName: 'English (India) ⚡', emoji: '🇮🇳' },
  'en-ZA': { locale: 'en-ZA', nativeName: 'English (South Africa) 🐢', emoji: '🇿🇦' },
  es: { locale: 'es-ES', nativeName: LANGUAGES.es.nativeName + ' ⚡', emoji: LANGUAGES.es.emoji },
  'es-MX': { locale: 'es-MX', nativeName: LANGUAGES['es-MX'].nativeName + ' ⚡', emoji: LANGUAGES['es-MX'].emoji },
  'es-AR': { locale: 'es-AR', nativeName: 'Español (Argentina) 🐢', emoji: '🇦🇷' },
  'es-CO': { locale: 'es-CO', nativeName: 'Español (Colombia) 🐢', emoji: '🇨🇴' },
  et: { locale: 'et-EE', nativeName: LANGUAGES.et.nativeName + ' 🐢', emoji: LANGUAGES.et.emoji },
  fa: { locale: 'fa-IR', nativeName: LANGUAGES.fa.nativeName + ' 🐢', emoji: LANGUAGES.fa.emoji },
  fi: { locale: 'fi-FI', nativeName: LANGUAGES.fi.nativeName + ' ⚡', emoji: LANGUAGES.fi.emoji },
  fr: { locale: 'fr-FR', nativeName: LANGUAGES.fr.nativeName + ' ⚡', emoji: LANGUAGES.fr.emoji },
  'fr-CA': { locale: 'fr-CA', nativeName: 'Français (Canada) 🐢', emoji: '🇨🇦' },
  'fr-CH': { locale: 'fr-CH', nativeName: 'Français (Suisse) 🐢', emoji: '🇨🇭' },
  ga: { locale: 'ga-IE', nativeName: LANGUAGES.ga.nativeName + ' 🐢', emoji: LANGUAGES.ga.emoji },
  he: { locale: 'he-IL', nativeName: LANGUAGES.he.nativeName + ' ⚡', emoji: LANGUAGES.he.emoji },
  hi: { locale: 'hi-IN', nativeName: LANGUAGES.hi.nativeName + ' ⚡', emoji: LANGUAGES.hi.emoji },
  hr: { locale: 'hr-HR', nativeName: LANGUAGES.hr.nativeName + ' 🐢', emoji: LANGUAGES.hr.emoji },
  hu: { locale: 'hu-HU', nativeName: LANGUAGES.hu.nativeName + ' 🐢', emoji: LANGUAGES.hu.emoji },
  id: { locale: 'id-ID', nativeName: LANGUAGES.id.nativeName + ' ⚡', emoji: LANGUAGES.id.emoji },
  it: { locale: 'it-IT', nativeName: LANGUAGES.it.nativeName + ' ⚡', emoji: LANGUAGES.it.emoji },
  ja: { locale: 'ja-JP', nativeName: LANGUAGES.ja.nativeName + ' ⚡', emoji: LANGUAGES.ja.emoji },
  ko: { locale: 'ko-KR', nativeName: LANGUAGES.ko.nativeName + ' ⚡', emoji: LANGUAGES.ko.emoji },
  lt: { locale: 'lt-LT', nativeName: LANGUAGES.lt.nativeName + ' 🐢', emoji: LANGUAGES.lt.emoji },
  lv: { locale: 'lv-LV', nativeName: LANGUAGES.lv.nativeName + ' 🐢', emoji: LANGUAGES.lv.emoji },
  ms: { locale: 'ms-MY', nativeName: LANGUAGES.ms.nativeName + ' 🐢', emoji: LANGUAGES.ms.emoji },
  mt: { locale: 'mt-MT', nativeName: LANGUAGES.mt.nativeName + ' 🐢', emoji: LANGUAGES.mt.emoji },
  nb: { locale: 'nb-NO', nativeName: LANGUAGES.nb.nativeName + ' 🐢', emoji: LANGUAGES.nb.emoji },
  nl: { locale: 'nl-NL', nativeName: LANGUAGES.nl.nativeName + ' ⚡', emoji: LANGUAGES.nl.emoji },
  pl: { locale: 'pl-PL', nativeName: LANGUAGES.pl.nativeName + ' ⚡', emoji: LANGUAGES.pl.emoji },
  pt: { locale: 'pt-PT', nativeName: LANGUAGES.pt.nativeName + ' ⚡', emoji: LANGUAGES.pt.emoji },
  'pt-BR': { locale: 'pt-BR', nativeName: LANGUAGES['pt-BR'].nativeName + ' ⚡', emoji: LANGUAGES['pt-BR'].emoji },
  ro: { locale: 'ro-RO', nativeName: LANGUAGES.ro.nativeName + ' 🐢', emoji: LANGUAGES.ro.emoji },
  ru: { locale: 'ru-RU', nativeName: LANGUAGES.ru.nativeName + ' ⚡', emoji: LANGUAGES.ru.emoji },
  sk: { locale: 'sk-SK', nativeName: LANGUAGES.sk.nativeName + ' 🐢', emoji: LANGUAGES.sk.emoji },
  sl: { locale: 'sl-SI', nativeName: LANGUAGES.sl.nativeName + ' 🐢', emoji: LANGUAGES.sl.emoji },
  sr: { locale: 'sr-RS', nativeName: LANGUAGES.sr.nativeName + ' 🐢', emoji: LANGUAGES.sr.emoji },
  sv: { locale: 'sv-SE', nativeName: LANGUAGES.sv.nativeName + ' ⚡', emoji: LANGUAGES.sv.emoji },
  th: { locale: 'th-TH', nativeName: LANGUAGES.th.nativeName + ' ⚡', emoji: LANGUAGES.th.emoji },
  tl: { locale: 'fil-PH', nativeName: LANGUAGES.tl.nativeName + ' 🐢', emoji: LANGUAGES.tl.emoji },
  tr: { locale: 'tr-TR', nativeName: LANGUAGES.tr.nativeName + ' 🐢', emoji: LANGUAGES.tr.emoji },
  uk: { locale: 'uk-UA', nativeName: LANGUAGES.uk.nativeName + ' 🐢', emoji: LANGUAGES.uk.emoji },
  ur: { locale: 'ur-IN', nativeName: LANGUAGES.ur.nativeName + ' 🐢', emoji: LANGUAGES.ur.emoji },
  vi: { locale: 'vi-VN', nativeName: LANGUAGES.vi.nativeName + ' 🐢', emoji: LANGUAGES.vi.emoji },
  zh: { locale: 'zh-CN', nativeName: LANGUAGES.zh.nativeName + ' ⚡', emoji: LANGUAGES.zh.emoji },
  'zh-HK': { locale: 'zh-HK', nativeName: '中文 (香港) 🐢', emoji: '🇭🇰' },
  'zh-TW': { locale: 'zh-TW', nativeName: '中文 (台灣) 🐢', emoji: '🇹🇼' },
  // Neue Sprachen
  'nl-BE': { locale: 'nl-BE', nativeName: 'Nederlands (België) 🐢', emoji: '🇧🇪' },
  'it-CH': { locale: 'it-CH', nativeName: 'Italiano (Svizzera) 🐢', emoji: '🇨🇭' },
  'ta-IN': { locale: 'ta-IN', nativeName: 'தமிழ் (இந்தியா) 🐢', emoji: '🇮🇳' },
  'te-IN': { locale: 'te-IN', nativeName: 'తెలుగు (భారతదేశం) 🐢', emoji: '🇮🇳' },
  'mr-IN': { locale: 'mr-IN', nativeName: 'मराठी (भारत) 🐢', emoji: '🇮🇳' },
  'gu-IN': { locale: 'gu-IN', nativeName: 'ગુજરાતી (ભારત) 🐢', emoji: '🇮🇳' },
  'kn-IN': { locale: 'kn-IN', nativeName: 'ಕನ್ನಡ (ಭಾರತ) 🐢', emoji: '🇮🇳' },
  'ml-IN': { locale: 'ml-IN', nativeName: 'മലയാളം (ഇന്ത്യ) 🐢', emoji: '🇮🇳' },
  'pa-IN': { locale: 'pa-IN', nativeName: 'ਪੰਜਾਬੀ (ਭਾਰਤ) 🐢', emoji: '🇮🇳' },
  'kk-KZ': { locale: 'kk-KZ', nativeName: 'Қазақ (Қазақстан) 🐢', emoji: '🇰🇿' },
  'uz-UZ': { locale: 'uz-UZ', nativeName: 'Oʻzbek (Oʻzbekiston) 🐢', emoji: '🇺🇿' },
  'ka-GE': { locale: 'ka-GE', nativeName: 'ქართული (საქართველო) 🐢', emoji: '🇬🇪' },
  'hy-AM': { locale: 'hy-AM', nativeName: 'Հայերեն (Հայաստան) 🐢', emoji: '🇦🇲' },
  'is-IS': { locale: 'is-IS', nativeName: 'Íslenska (Ísland) 🐢', emoji: '🇮🇸' },
  'sq-AL': { locale: 'sq-AL', nativeName: 'Shqip (Shqipëri) 🐢', emoji: '🇦🇱' },
  'mk-MK': { locale: 'mk-MK', nativeName: 'Македонски (Македонија) 🐢', emoji: '🇲🇰' },
  'cy-GB': { locale: 'cy-GB', nativeName: 'Cymraeg (Cymru) 🐢', emoji: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  'ca-ES': { locale: 'ca-ES', nativeName: 'Català (Espanya) 🐢', emoji: '🇪🇸' },
  'eu-ES': { locale: 'eu-ES', nativeName: 'Euskara (Espainia) 🐢', emoji: '🇪🇸' },
  'gl-ES': { locale: 'gl-ES', nativeName: 'Galego (España) 🐢', emoji: '🇪🇸' }
};

// Sprach-Familien Mapping für Single-Dialekt-Auswahl
const LANGUAGE_FAMILIES = {
  german: ['de', 'at', 'ch'],
  english: ['en', 'en-GB', 'en-AU', 'en-CA', 'en-IN', 'en-ZA'],
  arabic: ['ar', 'ar-AE', 'ar-EG'],
  spanish: ['es', 'es-MX', 'es-AR', 'es-CO'],
  french: ['fr', 'fr-CA', 'fr-CH'],
  portuguese: ['pt', 'pt-BR'],
  chinese: ['zh', 'zh-HK', 'zh-TW'],
  dutch: ['nl', 'nl-BE'],
  italian: ['it', 'it-CH']
};

// Helper-Funktion um die Sprachfamilie zu finden
function getLanguageFamily(langCode: string): string[] | null {
  for (const family of Object.values(LANGUAGE_FAMILIES)) {
    if (family.includes(langCode)) {
      return family;
    }
  }
  return null;
}

// Erstelle den Kontext
const RecordingLanguageContext = createContext<RecordingLanguageContextType>({
  recordingLanguages: [],
  addRecordingLanguage: async () => {},
  removeRecordingLanguage: async () => {},
  toggleRecordingLanguage: async () => {},
  supportedAzureLanguages: AZURE_SUPPORTED_LANGUAGES,
  dialectChangeNotification: null,
  clearDialectNotification: () => {},
});

// Hook für den Zugriff auf den Kontext
export const useRecordingLanguage = () => useContext(RecordingLanguageContext);

// Provider-Komponente
interface RecordingLanguageProviderProps {
  children: ReactNode;
}

export const RecordingLanguageProvider: React.FC<RecordingLanguageProviderProps> = ({ children }) => {
  const [recordingLanguages, setRecordingLanguages] = useState<string[]>([]);
  const [dialectChangeNotification, setDialectChangeNotification] = useState<{ oldDialect: string; newDialect: string } | null>(null);

  // Lade die gespeicherten Aufnahmesprachen beim Start
  useEffect(() => {
    const loadStoredLanguages = async () => {
      try {
        const storedLanguages = await AsyncStorage.getItem(RECORDING_LANGUAGES_STORAGE_KEY);
        if (storedLanguages) {
          const parsedLanguages = JSON.parse(storedLanguages);
          // Wenn keine Sprachen ausgewählt sind, setze Auto als Standard
          if (parsedLanguages.length === 0) {
            setRecordingLanguages(['auto']);
            await AsyncStorage.setItem(RECORDING_LANGUAGES_STORAGE_KEY, JSON.stringify(['auto']));
          } else {
            setRecordingLanguages(parsedLanguages);
          }
        } else {
          // Standardmäßig Auto-Modus verwenden
          setRecordingLanguages(['auto']);
          await AsyncStorage.setItem(RECORDING_LANGUAGES_STORAGE_KEY, JSON.stringify(['auto']));
        }
      } catch (error) {
        console.debug('Error loading recording languages:', error);
        // Bei Fehler auch Auto-Modus als Fallback setzen
        setRecordingLanguages(['auto']);
      }
    };

    loadStoredLanguages();
  }, []);

  // Funktion zum Speichern der Aufnahmesprachen
  const storeRecordingLanguages = async (languages: string[]) => {
    try {
      await AsyncStorage.setItem(RECORDING_LANGUAGES_STORAGE_KEY, JSON.stringify(languages));
    } catch (error) {
      console.debug('Error storing recording languages:', error);
    }
  };

  // Funktion zum Hinzufügen einer Sprache
  const addRecordingLanguage = async (language: string) => {
    if (!recordingLanguages.includes(language)) {
      const newLanguages = [...recordingLanguages, language];
      setRecordingLanguages(newLanguages);
      await storeRecordingLanguages(newLanguages);
    }
  };

  // Funktion zum Entfernen einer Sprache
  const removeRecordingLanguage = async (language: string) => {
    // Filtere die zu entfernende Sprache heraus
    const newLanguages = recordingLanguages.filter(lang => lang !== language);
    
    // Wenn keine Sprachen mehr übrig sind, setze Auto als Standard
    if (newLanguages.length === 0) {
      setRecordingLanguages(['auto']);
      await storeRecordingLanguages(['auto']);
    } else {
      setRecordingLanguages(newLanguages);
      await storeRecordingLanguages(newLanguages);
    }
  };

  // Funktion zum Umschalten einer Sprache
  const toggleRecordingLanguage = async (language: string) => {
    // Wenn "Auto" ausgewählt wird, deselektiere alle anderen Sprachen
    if (language === 'auto') {
      if (recordingLanguages.includes('auto')) {
        // Wenn Auto bereits ausgewählt ist, einfach deselektieren
        await removeRecordingLanguage('auto');
      } else {
        // Alle anderen Sprachen entfernen und nur Auto hinzufügen
        const newLanguages = ['auto'];
        setRecordingLanguages(newLanguages);
        await storeRecordingLanguages(newLanguages);
      }
    } else {
      // Wenn eine andere Sprache ausgewählt wird
      let newLanguages = recordingLanguages.filter(lang => lang !== 'auto');
      
      // Prüfe ob die Sprache zu einer Sprachfamilie gehört
      const languageFamily = getLanguageFamily(language);
      
      if (languageFamily) {
        // Check if another dialect from the same family is already selected
        const existingDialect = recordingLanguages.find(lang => 
          languageFamily.includes(lang) && lang !== language
        );
        
        if (existingDialect) {
          // Set notification for in-modal display
          const existingName = AZURE_SUPPORTED_LANGUAGES[existingDialect]?.nativeName.replace(' ⚡', '').replace(' 🐢', '') || existingDialect;
          const newName = AZURE_SUPPORTED_LANGUAGES[language]?.nativeName.replace(' ⚡', '').replace(' 🐢', '') || language;
          
          setDialectChangeNotification({
            oldDialect: existingName,
            newDialect: newName
          });
          
          // Auto-clear notification after 6 seconds
          setTimeout(() => {
            setDialectChangeNotification(null);
          }, 6000);
        }
        
        // Entferne alle anderen Dialekte der gleichen Sprachfamilie
        newLanguages = newLanguages.filter(lang => !languageFamily.includes(lang));
      }
      
      // Toggle-Verhalten
      if (recordingLanguages.includes(language)) {
        // Deselektieren
        newLanguages = newLanguages.filter(lang => lang !== language);
      } else {
        // Selektieren
        newLanguages.push(language);
      }
      
      // Wenn keine Sprachen mehr übrig sind, setze Auto als Standard
      if (newLanguages.length === 0) {
        newLanguages = ['auto'];
      }
      
      setRecordingLanguages(newLanguages);
      await storeRecordingLanguages(newLanguages);
    }
  };

  const clearDialectNotification = () => {
    setDialectChangeNotification(null);
  };

  return (
    <RecordingLanguageContext.Provider
      value={{
        recordingLanguages,
        addRecordingLanguage,
        removeRecordingLanguage,
        toggleRecordingLanguage,
        supportedAzureLanguages: AZURE_SUPPORTED_LANGUAGES,
        dialectChangeNotification,
        clearDialectNotification,
      }}
    >
      {children}
    </RecordingLanguageContext.Provider>
  );
};
