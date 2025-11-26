import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthProvider';
import { useAppTheme } from '../theme/ThemeProvider';
import { supabase } from '../utils/supabase';

// Typendefinitionen für die Token-Nutzung
type ModelUsage = {
  model_id: string;
  model_name: string;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_tokens: number;
  total_cost: number;
};

type UsageByPeriod = {
  time_period: string;
  total_tokens: number;
  total_cost: number;
};

type UsageSummary = {
  totalCost: number;
  totalTokens: number;
  modelCount: number;
  periodCount: number;
};

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { isDarkMode, toggleTheme } = useAppTheme();
  const router = useRouter();
  const { user, signOut } = useAuth();
  
  // Zustandsvariablen für Token-Nutzungsdaten
  const [modelUsage, setModelUsage] = useState<ModelUsage[]>([]);
  const [periodUsage, setPeriodUsage] = useState<UsageByPeriod[]>([]);
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'month' | 'year'>('month');

  // Funktion zum Laden der Token-Nutzungsdaten
  const loadUsageData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Lade die Token-Nutzung nach Modell
      const { data: modelData, error: modelError } = await supabase
        .rpc('get_user_model_usage', { user_id: user.id });
        
      if (modelError) {
        console.error('Fehler beim Laden der Modellnutzung:', modelError);
      } else if (modelData) {
        setModelUsage(modelData as ModelUsage[]);
      }
      
      // Lade die Token-Nutzung nach Zeitraum
      const { data: periodData, error: periodError } = await supabase
        .rpc('get_user_usage_by_period', { 
          user_id: user.id,
          period: selectedPeriod
        });
        
      if (periodError) {
        console.error('Fehler beim Laden der Zeitraumnutzung:', periodError);
      } else if (periodData) {
        setPeriodUsage(periodData as UsageByPeriod[]);
      }
      
      // Berechne die Zusammenfassung
      if (modelData) {
        const totalCost = (modelData as ModelUsage[]).reduce((sum, model) => sum + model.total_cost, 0);
        const totalTokens = (modelData as ModelUsage[]).reduce((sum, model) => sum + model.total_tokens, 0);
        
        setSummary({
          totalCost,
          totalTokens,
          modelCount: (modelData as ModelUsage[]).length,
          periodCount: periodData ? (periodData as UsageByPeriod[]).length : 0
        });
      }
    } catch (error) {
      console.error('Fehler beim Laden der Nutzungsdaten:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Lade die Nutzungsdaten beim ersten Rendern und wenn sich der Zeitraum ändert
  useEffect(() => {
    if (user) {
      loadUsageData();
    }
  }, [user, selectedPeriod]);

  // Formatierungsfunktionen
  const formatCost = (cost: number): string => {
    return `$${cost.toFixed(4)}`;
  };
  
  const formatTokens = (tokens: number): string => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(2)}M`;
    } else if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}K`;
    } else {
      return tokens.toString();
    }
  };
  
  const handlePeriodChange = (period: 'day' | 'month' | 'year') => {
    setSelectedPeriod(period);
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Abmelden',
      'Möchtest du dich wirklich abmelden?',
      [
        {
          text: 'Abbrechen',
          style: 'cancel',
        },
        {
          text: 'Abmelden',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth/login');
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Profil</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={[styles.avatarContainer, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.email?.split('@')[0] || 'Benutzer'}
          </Text>
          <Text style={[styles.userEmail, { color: colors.text + '80' }]}>
            {user?.email || 'E-Mail nicht verfügbar'}
          </Text>
        </View>
      </View>
      
      {/* Token-Nutzungsstatistiken */}
      <View style={styles.usageSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Token-Nutzung</Text>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text + '80' }]}>
              Lade Nutzungsdaten...
            </Text>
          </View>
        ) : summary ? (
          <>
            {/* Zusammenfassung der Nutzung */}
            <View style={[styles.usageSummaryCard, {
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: isDarkMode ? undefined : '#000',
            }]}>
              <View style={styles.usageSummaryRow}>
                <View style={styles.usageSummaryItem}>
                  <Text style={[styles.usageSummaryValue, { color: colors.primary }]}>
                    {formatTokens(summary.totalTokens)}
                  </Text>
                  <Text style={[styles.usageSummaryLabel, { color: colors.text + '80' }]}>
                    Tokens gesamt
                  </Text>
                </View>
                
                <View style={styles.usageSummaryDivider} />
                
                <View style={styles.usageSummaryItem}>
                  <Text style={[styles.usageSummaryValue, { color: colors.primary }]}>
                    ${summary.totalCost.toFixed(4)}
                  </Text>
                  <Text style={[styles.usageSummaryLabel, { color: colors.text + '80' }]}>
                    Kosten gesamt
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Zeitraumauswahl */}
            <View style={styles.periodSelector}>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  selectedPeriod === 'day' && { 
                    backgroundColor: colors.primary + '20',
                    borderColor: colors.primary
                  }
                ]}
                onPress={() => handlePeriodChange('day')}
              >
                <Text style={[
                  styles.periodButtonText,
                  { color: colors.text },
                  selectedPeriod === 'day' && { color: colors.primary, fontWeight: '600' }
                ]}>
                  Tag
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  selectedPeriod === 'month' && { 
                    backgroundColor: colors.primary + '20',
                    borderColor: colors.primary
                  }
                ]}
                onPress={() => handlePeriodChange('month')}
              >
                <Text style={[
                  styles.periodButtonText,
                  { color: colors.text },
                  selectedPeriod === 'month' && { color: colors.primary, fontWeight: '600' }
                ]}>
                  Monat
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  selectedPeriod === 'year' && { 
                    backgroundColor: colors.primary + '20',
                    borderColor: colors.primary
                  }
                ]}
                onPress={() => handlePeriodChange('year')}
              >
                <Text style={[
                  styles.periodButtonText,
                  { color: colors.text },
                  selectedPeriod === 'year' && { color: colors.primary, fontWeight: '600' }
                ]}>
                  Jahr
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Modellnutzung */}
            {modelUsage.length > 0 ? (
              <View style={styles.modelUsageContainer}>
                <Text style={[styles.usageSubtitle, { color: colors.text }]}>
                  Modelle
                </Text>
                
                {modelUsage.map((model, index) => (
                  <View 
                    key={model.model_id} 
                    style={[
                      styles.modelUsageItem,
                      { 
                        backgroundColor: colors.card,
                        borderColor: colors.border 
                      },
                      index === modelUsage.length - 1 && { marginBottom: 0 }
                    ]}
                  >
                    <View style={styles.modelUsageHeader}>
                      <Text style={[styles.modelName, { color: colors.text }]}>
                        {model.model_name}
                      </Text>
                      <Text style={[styles.modelCost, { color: colors.primary }]}>
                        ${model.total_cost.toFixed(4)}
                      </Text>
                    </View>
                    
                    <View style={styles.modelUsageDetails}>
                      <View style={styles.tokenItem}>
                        <Text style={[styles.tokenCount, { color: colors.text }]}>
                          {formatTokens(model.total_prompt_tokens)}
                        </Text>
                        <Text style={[styles.tokenLabel, { color: colors.text + '70' }]}>
                          Prompt
                        </Text>
                      </View>
                      
                      <View style={styles.tokenItem}>
                        <Text style={[styles.tokenCount, { color: colors.text }]}>
                          {formatTokens(model.total_completion_tokens)}
                        </Text>
                        <Text style={[styles.tokenLabel, { color: colors.text + '70' }]}>
                          Completion
                        </Text>
                      </View>
                      
                      <View style={styles.tokenItem}>
                        <Text style={[styles.tokenCount, { color: colors.text }]}>
                          {formatTokens(model.total_tokens)}
                        </Text>
                        <Text style={[styles.tokenLabel, { color: colors.text + '70' }]}>
                          Gesamt
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.text + '80' }]}>
                  Keine Modellnutzung vorhanden
                </Text>
              </View>
            )}
            
            {/* Nutzung nach Zeitraum */}
            {periodUsage.length > 0 ? (
              <View style={styles.periodUsageContainer}>
                <Text style={[styles.usageSubtitle, { color: colors.text }]}>
                  Nutzung nach {
                    selectedPeriod === 'day' ? 'Tagen' :
                    selectedPeriod === 'month' ? 'Monaten' : 'Jahren'
                  }
                </Text>
                
                {periodUsage.slice(0, 5).map((period, index) => (
                  <View 
                    key={period.time_period} 
                    style={[
                      styles.periodUsageItem,
                      { 
                        backgroundColor: colors.card,
                        borderColor: colors.border 
                      }
                    ]}
                  >
                    <Text style={[styles.periodLabel, { color: colors.text }]}>
                      {period.time_period}
                    </Text>
                    <View style={styles.periodUsageContent}>
                      <Text style={[styles.periodTokens, { color: colors.text + 'CC' }]}>
                        {formatTokens(period.total_tokens)} Tokens
                      </Text>
                      <Text style={[styles.periodCost, { color: colors.primary }]}>
                        ${period.total_cost.toFixed(4)}
                      </Text>
                    </View>
                  </View>
                ))}
                
                {periodUsage.length > 5 && (
                  <TouchableOpacity style={[styles.viewMoreButton, { borderColor: colors.border }]}>
                    <Text style={[styles.viewMoreText, { color: colors.primary }]}>
                      Mehr anzeigen...
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.text + '80' }]}>
                  Keine Nutzungsdaten für diesen Zeitraum
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.text + '80' }]}>
              Keine Nutzungsdaten verfügbar
            </Text>
          </View>
        )}
      </View>

      <View style={styles.settingsSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Einstellungen</Text>
        
        <TouchableOpacity 
          style={[styles.settingItem, { borderBottomColor: colors.border }]}
          onPress={toggleTheme}
        >
          <View style={styles.settingIconContainer}>
            <Ionicons 
              name={isDarkMode ? "moon" : "sunny"} 
              size={24} 
              color={colors.primary} 
            />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>
              Erscheinungsbild
            </Text>
            <Text style={[styles.settingValue, { color: colors.text + '80' }]}>
              {isDarkMode ? 'Dunkel' : 'Hell'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text + '60'} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.settingItem, { borderBottomColor: colors.border }]}
        >
          <View style={styles.settingIconContainer}>
            <Ionicons name="notifications" size={24} color={colors.primary} />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>
              Benachrichtigungen
            </Text>
            <Text style={[styles.settingValue, { color: colors.text + '80' }]}>
              Ein
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text + '60'} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.accountSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Konto</Text>
        
        <TouchableOpacity 
          style={[styles.settingItem, { borderBottomColor: colors.border }]}
        >
          <View style={styles.settingIconContainer}>
            <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>
              Passwort ändern
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text + '60'} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.settingItem, { borderBottomColor: colors.border }]}
          onPress={handleSignOut}
        >
          <View style={styles.settingIconContainer}>
            <Ionicons name="log-out" size={24} color="#FF3B30" />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: '#FF3B30' }]}>
              Abmelden
            </Text>
          </View>
        </TouchableOpacity>
      </View>
      
      <View style={styles.appInfo}>
        <Text style={[styles.versionText, { color: colors.text + '60' }]}>
          Version 1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  header: {
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  // Nutzungsstatistik-Stile
  usageSection: {
    marginBottom: 30,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  usageSummaryCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      },
    }),
  },
  usageSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  usageSummaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  usageSummaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 10,
  },
  usageSummaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  usageSummaryLabel: {
    fontSize: 14,
  },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    justifyContent: 'center',
  },
  periodButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  periodButtonText: {
    fontSize: 14,
  },
  modelUsageContainer: {
    marginBottom: 20,
  },
  usageSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  modelUsageItem: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  modelUsageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modelName: {
    fontSize: 16,
    fontWeight: '600',
  },
  modelCost: {
    fontSize: 16,
    fontWeight: '600',
  },
  modelUsageDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tokenItem: {
    alignItems: 'center',
    flex: 1,
  },
  tokenCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  tokenLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  periodUsageContainer: {
    marginBottom: 20,
  },
  periodUsageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
  },
  periodLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  periodUsageContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodTokens: {
    fontSize: 14,
    marginRight: 10,
  },
  periodCost: {
    fontSize: 14,
    fontWeight: '600',
  },
  viewMoreButton: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 8,
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
  },
  // Bestehende Stile
  settingsSection: {
    marginBottom: 30,
  },
  accountSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingIconContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 14,
    marginTop: 2,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 16,
    paddingBottom: 20,
  },
  versionText: {
    fontSize: 14,
  },
});
