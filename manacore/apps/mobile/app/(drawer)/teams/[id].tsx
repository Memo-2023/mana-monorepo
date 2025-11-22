import React, { useState, useEffect } from 'react';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal, Pressable } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

import { Container } from '~/components/Container';
import TeamMembers from '../../../components/TeamMembers';
import { useTheme } from '../../../utils/themeContext';
import { supabase } from '../../../utils/supabase';
import { refreshTeamList } from '../../../components/TeamList';

export default function TeamDetails() {
  const router = useRouter();
  const { id: teamId, name: initialTeamName } = useLocalSearchParams<{ id: string, name: string }>();
  const { isDarkMode } = useTheme();
  const [teamName, setTeamName] = useState(initialTeamName || '');
  const [isEditing, setIsEditing] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (initialTeamName) {
      setTeamName(initialTeamName);
      setNewTeamName(initialTeamName);
    }
  }, [initialTeamName]);

  const navigateBack = () => {
    router.push('/teams');
  };

  const startEditing = () => {
    setIsEditing(true);
    setNewTeamName(teamName);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const updateTeamName = async () => {
    if (!newTeamName.trim()) {
      Alert.alert('Fehler', 'Der Teamname darf nicht leer sein.');
      return;
    }

    if (newTeamName.trim() === teamName) {
      setIsEditing(false);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('teams')
        .update({ name: newTeamName.trim() })
        .eq('id', teamId);

      if (error) throw error;

      setTeamName(newTeamName.trim());
      setIsEditing(false);
      Alert.alert('Erfolg', 'Der Teamname wurde erfolgreich aktualisiert.');
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Teamnamens:', error);
      Alert.alert('Fehler', 'Es ist ein Fehler beim Aktualisieren des Teamnamens aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  const deleteTeam = () => {
    console.log('Delete team button clicked, teamId:', teamId);
    // Modal öffnen statt Alert anzeigen
    setShowDeleteModal(true);
  };
  
  const confirmDelete = () => {
    console.log('Löschen bestätigt für Team:', teamId);
    setShowDeleteModal(false);
    handleTeamDeletion();
  };
  
  const cancelDelete = () => {
    console.log('Löschen abgebrochen');
    setShowDeleteModal(false);
  };
  
  const handleTeamDeletion = async () => {
    console.log('Starting deletion process for team:', teamId);
    setDeletingTeam(true);
    
    try {
      // Zuerst alle Abhängigkeiten prüfen
      console.log('Checking for dependencies...');
      
      // 1. Prüfe auf credit_transactions
      const { data: txData, error: txCheckError } = await supabase
        .from('credit_transactions')
        .select('id')
        .eq('team_id', teamId);
      
      console.log('Credit transactions:', txData);
      
      // 2. Prüfe auf team_members
      const { data: memberData, error: memberCheckError } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', teamId);
      
      console.log('Team members:', memberData);
      
      // 3. Prüfe auf user_roles
      const { data: roleData, error: roleCheckError } = await supabase
        .from('user_roles')
        .select('id')
        .eq('team_id', teamId);
      
      console.log('User roles:', roleData);
      
      // Jetzt versuchen wir, alle Abhängigkeiten zu löschen
      
      // 1. Lösche credit_transactions
      if (txData && txData.length > 0) {
        console.log('Deleting credit transactions...');
        const { error: txDeleteError } = await supabase
          .from('credit_transactions')
          .delete()
          .eq('team_id', teamId);
        
        if (txDeleteError) {
          console.error('Error deleting credit transactions:', txDeleteError);
        }
      }
      
      // 2. Lösche team_members
      if (memberData && memberData.length > 0) {
        console.log('Deleting team members...');
        const { error: memberDeleteError } = await supabase
          .from('team_members')
          .delete()
          .eq('team_id', teamId);
        
        if (memberDeleteError) {
          console.error('Error deleting team members:', memberDeleteError);
        }
      }
      
      // 3. Lösche user_roles
      if (roleData && roleData.length > 0) {
        console.log('Deleting user roles...');
        const { error: roleDeleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('team_id', teamId);
        
        if (roleDeleteError) {
          console.error('Error deleting user roles:', roleDeleteError);
        }
      }
      
      // 4. Schließlich das Team löschen
      console.log('Deleting team...');
      const { data, error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);
      
      console.log('Team deletion response:', { data, error });
      
      if (error) {
        throw error;
      }
      
      console.log('Team successfully deleted');
      
      // Teamliste aktualisieren, wenn der Benutzer authentifiziert ist
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Teamliste aktualisieren
        refreshTeamList(session.user.id, () => {
          console.log('Team list refreshed after deletion');
        });
      }
      
      // Erfolgsmeldung anzeigen und zurück zur Teamliste navigieren
      Alert.alert(
        'Erfolg', 
        'Das Team wurde erfolgreich gelöscht.',
        [{ 
          text: 'OK', 
          onPress: () => {
            console.log('Navigating back to teams list');
            // Zurück zur Teamliste navigieren
            router.replace('/teams');
          }
        }]
      );
      
      // Auch ohne Klick auf OK zurück zur Teamliste navigieren (nach kurzer Verzögerung)
      setTimeout(() => {
        router.replace('/teams');
      }, 1000);
    } catch (error: any) {
      console.error('Fehler beim Löschen des Teams:', error);
      
      // Detaillierte Fehlermeldung anzeigen
      Alert.alert(
        'Fehler', 
        `Es ist ein Fehler beim Löschen des Teams aufgetreten: ${error?.message || JSON.stringify(error)}`,
        [{ text: 'OK' }]
      );
    } finally {
      setDeletingTeam(false);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: teamName || 'Team-Details',
          headerLargeTitle: true,
        }} 
      />
      
      {/* Lösch-Bestätigungsmodal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showDeleteModal}
        onRequestClose={cancelDelete}
      >
        <View className="flex-1 justify-center items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className={`m-5 p-6 rounded-xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`} style={{ width: '80%' }}>
            <View className="items-center mb-4">
              <FontAwesome5 name="exclamation-triangle" size={40} color="#EF4444" />
            </View>
            
            <Text className={`text-xl font-bold mb-2 text-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Team löschen
            </Text>
            
            <Text className={`text-base mb-6 text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Möchtest du das Team "{teamName}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </Text>
            
            <View className="flex-row justify-between">
              <TouchableOpacity 
                className={`flex-1 py-3 rounded-lg mr-2 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}
                onPress={cancelDelete}
              >
                <Text className={`text-center font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Abbrechen</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="flex-1 py-3 rounded-lg ml-2 bg-red-600"
                onPress={confirmDelete}
                disabled={deletingTeam}
              >
                {deletingTeam ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-center font-medium text-white">Löschen</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <Container>
        <ScrollView className="flex-1">
          <View className="flex-row justify-between mx-2.5 my-2.5">
            <TouchableOpacity 
              className={`flex-row items-center py-2 px-4 rounded-lg border ${isDarkMode ? 'border-blue-500' : 'border-blue-600'}`}
              onPress={navigateBack}
            >
              <FontAwesome5 name="arrow-left" size={16} color={isDarkMode ? '#93C5FD' : '#0055FF'} className="mr-2" />
              <Text className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'} font-semibold text-sm`}>Zurück zu meinen Teams</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className={`flex-row items-center py-2 px-4 rounded-lg ${deletingTeam ? 'bg-gray-500' : 'bg-red-600'}`}
              onPress={deleteTeam} // Öffnet jetzt den Modal-Dialog
              disabled={deletingTeam}
              activeOpacity={0.7}
            >
              {deletingTeam ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <FontAwesome5 name="trash-alt" size={16} color="white" className="mr-2" />
                  <Text className="text-white font-semibold text-sm">Team löschen</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <TeamMembers teamId={teamId} />
        </ScrollView>
      </Container>
    </>
  );
}
