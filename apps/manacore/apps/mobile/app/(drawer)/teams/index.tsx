import React, { useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { ScrollView, Text, View, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

import { Container } from '~/components/Container';
import TeamList from '../../../components/TeamList';
import CreateTeam from '../../../components/CreateTeam';
import { useTheme } from '../../../utils/themeContext';

export default function Teams() {
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const { isDarkMode } = useTheme();
  const router = useRouter();
  
  const handleTeamCreated = (teamId: string, teamName: string) => {
    console.log('Team erstellt, navigiere zur Detailseite:', teamId, teamName);
    
    // Zuerst zurück zur Teamliste wechseln
    setShowCreateTeam(false);
    
    // Dann zur Detailseite des neuen Teams navigieren
    // Verzögerung erhöht für stabilere Navigation
    setTimeout(() => {
      router.push({
        pathname: '/teams/[id]',
        params: { id: teamId, name: teamName }
      });
    }, 300); // Verzögerung erhöht für bessere Stabilität
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Teams',
          headerLargeTitle: true,
        }} 
      />
      <Container>
        <ScrollView className="flex-1">
          {!showCreateTeam ? (
            <>
              <View className="flex-row justify-between items-center mx-2.5 my-2.5">
                <Text className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Meine Teams</Text>
                <TouchableOpacity 
                  className={`${isDarkMode ? 'bg-blue-700' : 'bg-blue-600'} flex-row items-center py-2 px-4 rounded-lg shadow`}
                  onPress={() => setShowCreateTeam(true)}
                >
                  <FontAwesome5 name="plus" size={14} color="white" className="mr-2" />
                  <Text className="text-white font-semibold text-sm">Neues Team</Text>
                </TouchableOpacity>
              </View>
              <TeamList hideTitle={true} />
            </>
          ) : (
            <>
              <View className="flex-row justify-end mx-2.5 my-2.5">
                <TouchableOpacity 
                  className={`flex-row items-center py-2 px-4 rounded-lg border ${isDarkMode ? 'border-blue-500' : 'border-blue-600'}`}
                  onPress={() => setShowCreateTeam(false)}
                >
                  <FontAwesome5 name="arrow-left" size={16} color={isDarkMode ? '#93C5FD' : '#0055FF'} className="mr-2" />
                  <Text className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'} font-semibold text-sm`}>Zurück zu meinen Teams</Text>
                </TouchableOpacity>
              </View>
              <CreateTeam onTeamCreated={handleTeamCreated} />
            </>
          )}
        </ScrollView>
      </Container>
    </>
  );
}

// NativeWind wird für das Styling verwendet, daher sind keine StyleSheet-Definitionen erforderlich
