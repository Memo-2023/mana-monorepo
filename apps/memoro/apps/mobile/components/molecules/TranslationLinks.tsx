import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useRouter } from 'expo-router';
import Text from '~/components/atoms/Text';
import Icon from '~/components/atoms/Icon';
import { getAuthenticatedClient } from '~/features/auth/lib/supabaseClient';
import colors from '~/tailwind.config.js';

interface TranslationLinksProps {
  memoId: string;
  memoMetadata?: any;
}

interface TranslationInfo {
  memo_id: string;
  target_language: string;
  translated_at: string;
  translator_model?: string;
}

interface OriginalInfo {
  source_memo_id: string;
  source_language: string;
  target_language: string;
  translated_at: string;
}

// Sprach-Mapping für bessere Anzeige
const LANGUAGE_NAMES: Record<string, string> = {
  'de': 'Deutsch',
  'en': 'English',
  'es': 'Español',
  'fr': 'Français',
  'it': 'Italiano',
  'pt': 'Português',
  'nl': 'Nederlands',
  'pl': 'Polski',
  'ru': 'Русский',
  'ja': '日本語',
  'ko': '한국어',
  'zh': '中文',
  'ar': 'العربية',
  'hi': 'हिन्दी',
  'tr': 'Türkçe',
  'sv': 'Svenska',
  'da': 'Dansk',
  'no': 'Norsk',
  'fi': 'Suomi',
  'cs': 'Čeština',
  'sk': 'Slovenčina',
  'hu': 'Magyar',
  'ro': 'Română',
  'bg': 'Български',
  'hr': 'Hrvatski',
  'sr': 'Српски',
  'sl': 'Slovenščina',
  'et': 'Eesti',
  'lv': 'Latviešu',
  'lt': 'Lietuvių',
  'mt': 'Malti',
  'ga': 'Gaeilge',
  'el': 'Ελληνικά',
  'uk': 'Українська',
  'bn': 'বাংলা',
  'ur': 'اردو',
  'fa': 'فارسی',
  'vi': 'Tiếng Việt',
  'id': 'Bahasa Indonesia'
};

const LANGUAGE_FLAGS: Record<string, string> = {
  'de': '🇩🇪',
  'en': '🇺🇸',
  'es': '🇪🇸',
  'fr': '🇫🇷',
  'it': '🇮🇹',
  'pt': '🇵🇹',
  'nl': '🇳🇱',
  'pl': '🇵🇱',
  'ru': '🇷🇺',
  'ja': '🇯🇵',
  'ko': '🇰🇷',
  'zh': '🇨🇳',
  'ar': '🇸🇦',
  'hi': '🇮🇳',
  'tr': '🇹🇷',
  'sv': '🇸🇪',
  'da': '🇩🇰',
  'no': '🇳🇴',
  'fi': '🇫🇮',
  'cs': '🇨🇿',
  'sk': '🇸🇰',
  'hu': '🇭🇺',
  'ro': '🇷🇴',
  'bg': '🇧🇬',
  'hr': '🇭🇷',
  'sr': '🇷🇸',
  'sl': '🇸🇮',
  'et': '🇪🇪',
  'lv': '🇱🇻',
  'lt': '🇱🇹',
  'mt': '🇲🇹',
  'ga': '🇮🇪',
  'el': '🇬🇷',
  'uk': '🇺🇦',
  'bn': '🇧🇩',
  'ur': '🇵🇰',
  'fa': '🇮🇷',
  'vi': '🇻🇳',
  'id': '🇮🇩'
};

/**
 * Komponente zur Anzeige von Übersetzungsverknüpfungen
 * Zeigt Links zum Original-Memo und zu verfügbaren Übersetzungen
 */
const TranslationLinks: React.FC<TranslationLinksProps> = ({ 
  memoId, 
  memoMetadata 
}) => {
  const { isDark, themeVariant } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const [originalMemoTitle, setOriginalMemoTitle] = useState<string>('');
  const [loadingOriginal, setLoadingOriginal] = useState(false);

  // Prüfe ob das aktuelle Memo eine Übersetzung ist
  const translationInfo: OriginalInfo | null = memoMetadata?.translation || null;
  const isTranslation = !!translationInfo;

  // Hole verfügbare Übersetzungen (wenn das aktuelle Memo das Original ist)
  const availableTranslations: TranslationInfo[] = memoMetadata?.translations || [];

  // Lade den Titel des Original-Memos
  useEffect(() => {
    const loadOriginalTitle = async () => {
      if (!isTranslation || !translationInfo?.source_memo_id) return;

      setLoadingOriginal(true);
      try {
        const supabase = await getAuthenticatedClient();
        const { data: originalMemo, error } = await supabase
          .from('memos')
          .select('title')
          .eq('id', translationInfo.source_memo_id)
          .single();

        if (!error && originalMemo) {
          setOriginalMemoTitle(originalMemo.title || t('memo.untitled', 'Ohne Titel'));
        }
      } catch (error) {
        console.debug('Error loading original memo title:', error);
      } finally {
        setLoadingOriginal(false);
      }
    };

    loadOriginalTitle();
  }, [isTranslation, translationInfo?.source_memo_id, t]);

  // Helper function to get language display name
  const getLanguageDisplay = (langCode: string) => {
    const flag = LANGUAGE_FLAGS[langCode] || '🌐';
    const name = LANGUAGE_NAMES[langCode] || langCode;
    return `${flag} ${name}`;
  };

  // Handler für Navigation zum Original
  const handleNavigateToOriginal = () => {
    if (translationInfo?.source_memo_id) {
      router.push(`/(protected)/(memo)/${translationInfo.source_memo_id}`);
    }
  };

  // Handler für Navigation zu Übersetzung
  const handleNavigateToTranslation = (translationMemoId: string) => {
    router.push(`/(protected)/(memo)/${translationMemoId}`);
  };

  // Primärfarbe für Links
  const primaryColor = isDark
    ? ((colors as any).theme?.extend?.colors?.dark)?.[themeVariant]?.primary || '#f8d62b'
    : ((colors as any).theme?.extend?.colors)?.[themeVariant]?.primary || '#f8d62b';

  // Styles
  const styles = StyleSheet.create({
    container: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    headerText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000',
    },
    linkContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      borderRadius: 8,
      marginBottom: 8,
    },
    linkText: {
      flex: 1,
      fontSize: 14,
      color: isDark ? '#FFFFFF' : '#000000',
    },
    linkSubtext: {
      fontSize: 12,
      color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
      marginTop: 2,
    },
    chevronIcon: {
      marginLeft: 8,
    },
    divider: {
      height: 1,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      marginVertical: 8,
    },
  });

  // Wenn weder Original noch Übersetzungen vorhanden sind, nichts anzeigen
  if (!isTranslation && availableTranslations.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Icon 
          name="globe-outline" 
          size={20} 
          color={isDark ? '#FFFFFF' : '#000000'} 
        />
        <View style={{ width: 12 }} />
        <Text style={styles.headerText}>
          {t('memo.translations', 'Übersetzungen')}
        </Text>
      </View>

      {/* Link zum Original (wenn das aktuelle Memo eine Übersetzung ist) */}
      {isTranslation && translationInfo && (
        <Pressable
          style={styles.linkContainer}
          onPress={handleNavigateToOriginal}
          disabled={loadingOriginal}
        >
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.linkText}>
              {loadingOriginal ? (
                <ActivityIndicator size="small" color={primaryColor} />
              ) : (
                `${t('memo.original_memo', 'Original')}: ${LANGUAGE_FLAGS[translationInfo.source_language] || '🌐'} ${originalMemoTitle}`
              )}
            </Text>
          </View>
          <Icon 
            name="chevron-forward" 
            size={16} 
            color={isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'} 
            style={styles.chevronIcon} 
          />
        </Pressable>
      )}

      {/* Trennlinie wenn beide Bereiche vorhanden sind */}
      {isTranslation && availableTranslations.length > 0 && (
        <View style={styles.divider} />
      )}

      {/* Links zu verfügbaren Übersetzungen */}
      {availableTranslations.map((translation, index) => (
        <Pressable
          key={`${translation.memo_id}-${index}`}
          style={styles.linkContainer}
          onPress={() => handleNavigateToTranslation(translation.memo_id)}
        >
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.linkText}>
              {t('memo.translation_to', 'Übersetzung in')} {LANGUAGE_FLAGS[translation.target_language] || '🌐'} {LANGUAGE_NAMES[translation.target_language] || translation.target_language}
            </Text>
          </View>
          <Icon 
            name="chevron-forward" 
            size={16} 
            color={isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'} 
            style={styles.chevronIcon} 
          />
        </Pressable>
      ))}
    </View>
  );
};

export default TranslationLinks;