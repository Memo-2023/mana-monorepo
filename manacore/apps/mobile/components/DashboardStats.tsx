import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../utils/supabase';
import { Session } from '@supabase/supabase-js';
import { useTheme, lightColors, darkColors } from '../utils/themeContext';

export default function DashboardStats() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamCount, setTeamCount] = useState(0);
  const [orgCount, setOrgCount] = useState(0);
  const [availableMana, setAvailableMana] = useState(0);
  const [totalMana, setTotalMana] = useState(0);

  useEffect(() => {
    // Prüfe den aktuellen Authentifizierungsstatus
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserStats(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Abonniere Authentifizierungsänderungen
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserStats(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserStats(userId: string) {
    try {
      setLoading(true);
      
      // Hole alle Teams, in denen der Benutzer Mitglied ist
      const { data: teamMembers, error: teamMembersError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', userId);

      if (teamMembersError) throw teamMembersError;
      
      setTeamCount(teamMembers?.length || 0);

      // Hole alle Organisationen, in denen der Benutzer eine Rolle hat
      const { data: userRoles, error: userRolesError } = await supabase
        .from('user_roles')
        .select('organization_id')
        .eq('user_id', userId)
        .not('organization_id', 'is', null);

      if (userRolesError) throw userRolesError;
      
      // Entferne Duplikate (falls der Benutzer mehrere Rollen in einer Organisation hat)
      const uniqueOrgIds = [...new Set(userRoles?.map(role => role.organization_id) || [])];
      setOrgCount(uniqueOrgIds.length);
      
      // Hole die Mana-Informationen aus dem Profil des Benutzers
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('individual_quota, individual_usage')
        .eq('id', userId)
        .single();
        
      if (profileError) throw profileError;
      
      if (profileData) {
        const quota = profileData.individual_quota || 0;
        const usage = profileData.individual_usage || 0;
        const available = Math.max(0, quota - usage);
        
        setTotalMana(quota);
        setAvailableMana(available);
      }

    } catch (error) {
      console.error('Fehler beim Abrufen der Benutzerstatistiken:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!session || loading) {
    return (
      <View className={`flex-row justify-between ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 mb-5 shadow`}>
        <ActivityIndicator size="small" color={isDarkMode ? '#60A5FA' : '#0055FF'} />
      </View>
    );
  }

  return (
    <View className="mb-5">
      {/* Mana-Anzeige */}
      <View className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 mb-3 shadow`}>
        <TouchableOpacity 
          className="items-center"
          onPress={() => router.push('/get-mana')}
        >
          <View className="flex-row items-center mb-2">
            <FontAwesome5 name="fire" size={18} color="#F59E0B" className="mr-2" />
            <Text className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Verfügbares Mana</Text>
          </View>
          <View className="w-full bg-gray-200 rounded-full h-4 mb-2 dark:bg-gray-700">
            <View 
              className="h-4 rounded-full" 
              style={{ 
                width: totalMana > 0 ? `${Math.min(100, (availableMana / totalMana) * 100)}%` : '0%',
                backgroundColor: isDarkMode ? darkColors.primary : lightColors.primary 
              }}
            />
          </View>
          <View className="flex-row justify-between w-full">
            <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Verfügbar: {availableMana}</Text>
            <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gesamt: {totalMana}</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Teams und Organisationen */}
      <View className={`flex-row justify-between ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 shadow`}>
        <TouchableOpacity 
          className={`flex-1 flex-row items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3 mr-2`}
          onPress={() => router.push('/teams')}
        >
          <View className="items-center">
            <View className="flex-row items-center mb-1">
              <FontAwesome5 name="users" size={16} color={isDarkMode ? '#60A5FA' : '#0055FF'} className="mr-2" />
              <Text className={`text-base font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Teams</Text>
            </View>
            <View className={`${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'} px-3 py-1 rounded-full`}>
              <Text className={`${isDarkMode ? 'text-blue-300' : 'text-blue-700'} font-medium`}>{teamCount}</Text>
            </View>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className={`flex-1 flex-row items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3 ml-2`}
          onPress={() => router.push('/organizations')}
        >
          <View className="items-center">
            <View className="flex-row items-center mb-1">
              <FontAwesome5 name="building" size={16} color={isDarkMode ? '#60A5FA' : '#0055FF'} className="mr-2" />
              <Text className={`text-base font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Organisationen</Text>
            </View>
            <View className={`${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'} px-3 py-1 rounded-full`}>
              <Text className={`${isDarkMode ? 'text-blue-300' : 'text-blue-700'} font-medium`}>{orgCount}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
