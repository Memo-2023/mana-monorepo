import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '~/features/theme/ThemeProvider';
import Text from '~/components/atoms/Text';
import Icon from '~/components/atoms/Icon';

interface ArchiveStatisticsProps {
  totalCount: number;
  totalDurationSeconds: number;
  totalSizeBytes: number;
  isLoading?: boolean;
}

/**
 * Komponente zur Anzeige der Archiv-Statistiken
 */
const ArchiveStatistics = ({ 
  totalCount, 
  totalDurationSeconds, 
  totalSizeBytes, 
  isLoading = false 
}: ArchiveStatisticsProps) => {
  const { t } = useTranslation();
  const { isDark, themeVariant } = useTheme();

  // Formatiere die Dauer als HH:MM:SS oder MM:SS
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  };

  // Formatiere die Dateigröße
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Theme-Farben
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const secondaryTextColor = isDark ? '#CCCCCC' : '#666666';
  const cardBackgroundColor = isDark ? '#2A2A2A' : '#F5F5F5';

  const styles = StyleSheet.create({
    container: {
      backgroundColor: cardBackgroundColor,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: textColor,
      marginBottom: 12,
      textAlign: 'center',
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 16,
      fontWeight: '600',
      color: textColor,
      marginTop: 4,
    },
    statLabel: {
      fontSize: 12,
      color: secondaryTextColor,
      textAlign: 'center',
      marginTop: 2,
    },
    divider: {
      width: 1,
      height: 40,
      backgroundColor: secondaryTextColor,
      opacity: 0.3,
      marginHorizontal: 12,
    },
    loadingText: {
      fontSize: 14,
      color: secondaryTextColor,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    localStorageText: {
      fontSize: 12,
      color: secondaryTextColor,
      textAlign: 'center',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: secondaryTextColor,
      opacity: 0.7,
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>
          {t('audio_archive.statistics', 'Archiv-Statistiken')}
        </Text>
        <Text style={styles.loadingText}>
          {t('audio_archive.loading_stats', 'Statistiken werden geladen...')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {t('audio_archive.statistics', 'Archiv-Statistiken')}
      </Text>
      
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Icon name="musical-notes" size={24} color={textColor} />
          <Text style={styles.statValue}>{totalCount}</Text>
          <Text style={styles.statLabel}>
            {t('audio_archive.recordings', 'Aufnahmen')}
          </Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.statItem}>
          <Icon name="time" size={24} color={textColor} />
          <Text style={styles.statValue}>{formatDuration(totalDurationSeconds)}</Text>
          <Text style={styles.statLabel}>
            {t('audio_archive.duration', 'Gesamtlänge')}
          </Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.statItem}>
          <Icon name="server" size={24} color={textColor} />
          <Text style={styles.statValue}>{formatFileSize(totalSizeBytes)}</Text>
          <Text style={styles.statLabel}>
            {t('audio_archive.size', 'Speicherplatz')}
          </Text>
        </View>
      </View>
      
      <Text style={styles.localStorageText}>
        {t('audio_archive.local_recordings', 'Lokale Aufnahmen auf deinem Gerät.')}
      </Text>
    </View>
  );
};

export default ArchiveStatistics;