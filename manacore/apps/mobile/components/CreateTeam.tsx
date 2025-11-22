import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { supabase } from '../utils/supabase';
import { Session } from '@supabase/supabase-js';
import { useTheme } from '../utils/themeContext';
import { useRouter } from 'expo-router';

interface Organization {
  id: string;
  name: string;
}

interface UserRole {
  organization_id: string;
  roles?: {
    name: string;
  };
}

interface CreateTeamProps {
  onTeamCreated?: (teamId: string, teamName: string) => void;
}

export default function CreateTeam({ onTeamCreated }: CreateTeamProps) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');
  const [allocatedCredits, setAllocatedCredits] = useState('');
  const [fetchingOrgs, setFetchingOrgs] = useState(true);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    // Prüfe den aktuellen Authentifizierungsstatus
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserOrganizations(session.user.id);
      } else {
        setFetchingOrgs(false);
      }
    });

    // Abonniere Authentifizierungsänderungen
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserOrganizations(session.user.id);
      } else {
        setFetchingOrgs(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserOrganizations(userId: string) {
    try {
      setFetchingOrgs(true);
      
      // Suche nach Organisationen, in denen der Benutzer eine Rolle hat
      const { data: userRoles, error: userRolesError } = await supabase
        .from('user_roles')
        .select('organization_id, roles(name)')
        .eq('user_id', userId)
        .not('organization_id', 'is', null) as { data: UserRole[] | null, error: any };

      if (userRolesError) throw userRolesError;

      if (userRoles && userRoles.length > 0) {
        // Extrahiere die Organisations-IDs
        const orgIds = userRoles
          .filter(role => {
            // Prüfe, ob der Benutzer ein Administrator oder Manager ist
            const roleName = role.roles?.name;
            return roleName === 'system_admin' || 
                   roleName === 'org_admin' || 
                   roleName === 'team_admin';
          })
          .map(role => role.organization_id);

        if (orgIds.length > 0) {
          // Hole die Details der Organisationen
          const { data: orgs, error: orgsError } = await supabase
            .from('organizations')
            .select('id, name')
            .in('id', orgIds);

          if (orgsError) throw orgsError;

          if (orgs && orgs.length > 0) {
            setOrganizations(orgs);
            // Setze die erste Organisation als Standard
            setSelectedOrgId(orgs[0].id);
          }
        }
      }
    } catch (error) {
      console.error('Fehler beim Abrufen der Organisationen:', error);
      Alert.alert('Fehler', 'Es ist ein Fehler beim Laden der Organisationen aufgetreten.');
    } finally {
      setFetchingOrgs(false);
    }
  }

  async function createTeam() {
    if (!session) {
      Alert.alert('Fehler', 'Sie müssen angemeldet sein, um ein Team zu erstellen.');
      return;
    }

    if (!selectedOrgId) {
      Alert.alert('Fehler', 'Bitte wählen Sie eine Organisation aus.');
      return;
    }

    if (!teamName.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie einen Teamnamen ein.');
      return;
    }

    const credits = parseInt(allocatedCredits);
    if (isNaN(credits) || credits < 0) {
      Alert.alert('Fehler', 'Bitte geben Sie eine gültige Anzahl an Krediten ein.');
      return;
    }

    try {
      setLoading(true);

      // 1. Prüfe, ob die Organisation genügend Kredite hat
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('total_credits, used_credits')
        .eq('id', selectedOrgId)
        .single();

      if (orgError) throw orgError;

      const availableCredits = org.total_credits - org.used_credits;
      if (credits > availableCredits) {
        Alert.alert('Fehler', `Die Organisation hat nicht genügend Kredite. Verfügbar: ${availableCredits}`);
        return;
      }

      // 2. Erstelle das Team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert([
          {
            organization_id: selectedOrgId,
            name: teamName.trim(),
            allocated_credits: credits
          }
        ])
        .select()
        .single();

      if (teamError) throw teamError;

      // 3. Aktualisiere die verwendeten Kredite der Organisation
      const { error: updateOrgError } = await supabase
        .from('organizations')
        .update({
          used_credits: org.used_credits + credits
        })
        .eq('id', selectedOrgId);

      if (updateOrgError) throw updateOrgError;

      // 4. Füge den aktuellen Benutzer als Team-Administrator hinzu
      // Zuerst hole die team_admin Rolle
      const { data: adminRole, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'team_admin')
        .single();

      if (roleError) throw roleError;

      // Füge die Benutzerrolle hinzu
      const { error: userRoleError } = await supabase
        .from('user_roles')
        .insert([
          {
            user_id: session.user.id,
            role_id: adminRole.id,
            team_id: team.id,
            organization_id: selectedOrgId
          }
        ]);

      if (userRoleError) throw userRoleError;

      // 5. Füge den Benutzer als Teammitglied hinzu
      const { error: teamMemberError } = await supabase
        .from('team_members')
        .insert([
          {
            team_id: team.id,
            user_id: session.user.id,
            allocated_credits: 0, // Standardmäßig keine Kredite zugewiesen
            used_credits: 0
          }
        ]);

      if (teamMemberError) throw teamMemberError;

      // Erfolgsbenachrichtigung anzeigen und direkt navigieren
      Alert.alert(
        'Erfolg', 
        `Das Team "${teamName}" wurde erfolgreich erstellt.`
      );
      
      // Direkt zur Teamdetailseite navigieren, ohne auf OK zu warten
      if (onTeamCreated) {
        console.log('Navigiere zur neuen Teamseite:', team.id, team.name);
        onTeamCreated(team.id, team.name);
      }
      
      // Formular zurücksetzen
      setTeamName('');
      setAllocatedCredits('');
    } catch (error) {
      console.error('Fehler beim Erstellen des Teams:', error);
      Alert.alert('Fehler', 'Es ist ein Fehler beim Erstellen des Teams aufgetreten.');
    } finally {
      setLoading(false);
    }
  }

  if (!session) {
    return (
      <View className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-5 m-2.5 shadow`}>
        <Text className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-center p-5`}>
          Bitte melden Sie sich an, um Teams zu erstellen.
        </Text>
      </View>
    );
  }

  if (fetchingOrgs) {
    return (
      <View className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-5 m-2.5 shadow`}>
        <ActivityIndicator size="large" color={isDarkMode ? '#93C5FD' : '#0055FF'} />
        <Text className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-center mt-2.5`}>Lade Organisationen...</Text>
      </View>
    );
  }

  if (organizations.length === 0) {
    return (
      <View className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-5 m-2.5 shadow`}>
        <Text className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-center p-5`}>
          Sie haben keine Berechtigung, Teams zu erstellen, oder Sie gehören keiner Organisation an.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1">
      <View className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-5 m-2.5 shadow`}>
        <Text className={`text-2xl font-bold mb-5 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Neues Team erstellen</Text>
        
        <View className="mb-4">
          <Text className={`text-base font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Organisation</Text>
          <View className="flex-row flex-wrap mb-2.5">
            {organizations.map((org) => (
              <TouchableOpacity
                key={org.id}
                className={`${selectedOrgId === org.id ? (isDarkMode ? 'bg-blue-800' : 'bg-blue-600') : (isDarkMode ? 'bg-gray-700' : 'bg-gray-100')} py-2.5 px-4 rounded-lg mr-2.5 mb-2.5`}
                onPress={() => setSelectedOrgId(org.id)}
              >
                <Text
                  className={`${selectedOrgId === org.id ? 'text-white' : (isDarkMode ? 'text-gray-300' : 'text-gray-700')} font-medium`}
                >
                  {org.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="mb-4">
          <Text className={`text-base font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Teamname</Text>
          <TextInput
            className={`h-12 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-gray-50 text-gray-800'} rounded-lg px-4 text-base`}
            value={teamName}
            onChangeText={setTeamName}
            placeholder="Name des Teams eingeben"
            placeholderTextColor={isDarkMode ? '#9CA3AF' : '#9CA3AF'}
          />
        </View>

        <View className="mb-4">
          <Text className={`text-base font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Zugewiesene Kredite</Text>
          <TextInput
            className={`h-12 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-gray-50 text-gray-800'} rounded-lg px-4 text-base`}
            value={allocatedCredits}
            onChangeText={setAllocatedCredits}
            placeholder="Anzahl der Kredite eingeben"
            placeholderTextColor={isDarkMode ? '#9CA3AF' : '#9CA3AF'}
            keyboardType="number-pad"
          />
        </View>

        <TouchableOpacity
          className={`h-12 rounded-lg justify-center items-center mt-2.5 ${loading ? (isDarkMode ? 'bg-gray-600' : 'bg-gray-400') : (isDarkMode ? 'bg-blue-700' : 'bg-blue-600')}`}
          onPress={createTeam}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text className="text-white text-base font-bold">Team erstellen</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// NativeWind wird für das Styling verwendet, daher sind keine StyleSheet-Definitionen erforderlich
