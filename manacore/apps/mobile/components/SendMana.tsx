import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../utils/supabase';
import { Session } from '@supabase/supabase-js';
import { useTheme } from '../utils/themeContext';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export default function SendMana() {
  const { isDarkMode } = useTheme();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [manaAmount, setManaAmount] = useState('');
  const [description, setDescription] = useState('');
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [userCredits, setUserCredits] = useState(0);

  useEffect(() => {
    // Prüfe den aktuellen Authentifizierungsstatus
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserCredits(session.user.id);
      }
    });

    // Abonniere Authentifizierungsänderungen
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserCredits(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserCredits(userId: string) {
    try {
      // Zuerst prüfen wir, ob der Benutzer ein Einzelnutzer ist
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_individual, individual_quota, individual_usage')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      if (profileData && profileData.is_individual) {
        // Wenn der Benutzer ein Einzelnutzer ist, verwenden wir die individuellen Kredite
        setUserCredits(profileData.individual_quota - profileData.individual_usage);
        return;
      }

      // Wenn der Benutzer kein Einzelnutzer ist, prüfen wir die Teamzugehörigkeit
      const { data: teamMemberData, error: teamMemberError } = await supabase
        .from('team_members')
        .select('allocated_credits, used_credits')
        .eq('user_id', userId);

      if (teamMemberError) throw teamMemberError;

      if (teamMemberData && teamMemberData.length > 0) {
        // Berechne die Summe der verfügbaren Kredite aus allen Teams
        const availableCredits = teamMemberData.reduce((total, member) => {
          return total + (member.allocated_credits - member.used_credits);
        }, 0);
        
        setUserCredits(availableCredits);
      } else {
        setUserCredits(0);
      }
    } catch (error) {
      console.error('Fehler beim Abrufen der Kredite:', error);
      setUserCredits(0);
    }
  }

  async function searchUser() {
    if (!recipientEmail.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie eine E-Mail-Adresse ein.');
      return;
    }

    try {
      setSearchLoading(true);
      
      // In einer realen Anwendung würden wir hier eine sichere Methode verwenden,
      // um Benutzer anhand ihrer E-Mail-Adresse zu finden, z.B. über eine spezielle API
      // oder eine Supabase-Funktion. Für dieses Beispiel simulieren wir die Suche.
      
      // Suche nach dem Profil mit einer bestimmten E-Mail
      // Hinweis: In einer echten Anwendung würde dies über eine sichere API erfolgen
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .limit(1);

      if (profileError || !profiles || profiles.length === 0) {
        Alert.alert('Fehler', 'Benutzer nicht gefunden.');
        setFoundUser(null);
        return;
      }

      // Für Demonstrationszwecke verwenden wir das erste gefundene Profil
      // In einer realen Anwendung würden wir natürlich das richtige Profil finden
      const profile = profiles[0];
      
      setFoundUser({
        id: profile.id,
        email: recipientEmail.trim(),
        first_name: profile.first_name || undefined,
        last_name: profile.last_name || undefined
      });
    } catch (error) {
      console.error('Fehler bei der Benutzersuche:', error);
      Alert.alert('Fehler', 'Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.');
    } finally {
      setSearchLoading(false);
    }
  }

  async function sendMana() {
    if (!session) {
      Alert.alert('Fehler', 'Sie müssen angemeldet sein, um Mana zu senden.');
      return;
    }

    if (!foundUser) {
      Alert.alert('Fehler', 'Bitte suchen Sie zuerst nach einem Empfänger.');
      return;
    }

    const amount = parseInt(manaAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Fehler', 'Bitte geben Sie einen gültigen Mana-Betrag ein.');
      return;
    }

    if (amount > userCredits) {
      Alert.alert('Fehler', 'Sie haben nicht genügend Mana-Kredite.');
      return;
    }

    try {
      setLoading(true);

      // 1. Erstelle einen Eintrag in der credit_transactions Tabelle
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert([
          {
            user_id: foundUser.id,
            amount: amount,
            description: description || 'Mana-Übertragung',
            app_id: 'manacore'
          }
        ]);

      if (transactionError) throw transactionError;

      // 2. Aktualisiere die Kredite des Empfängers
      const { data: recipientProfile, error: recipientProfileError } = await supabase
        .from('profiles')
        .select('is_individual, individual_quota')
        .eq('id', foundUser.id)
        .single();

      if (recipientProfileError) throw recipientProfileError;

      if (recipientProfile && recipientProfile.is_individual) {
        // Wenn der Empfänger ein Einzelnutzer ist, erhöhen wir sein Kontingent
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            individual_quota: recipientProfile.individual_quota + amount
          })
          .eq('id', foundUser.id);

        if (updateError) throw updateError;
      }

      // 3. Aktualisiere die Kredite des Senders
      const { data: senderProfile, error: senderProfileError } = await supabase
        .from('profiles')
        .select('is_individual, individual_usage')
        .eq('id', session.user.id)
        .single();

      if (senderProfileError) throw senderProfileError;

      if (senderProfile && senderProfile.is_individual) {
        // Wenn der Sender ein Einzelnutzer ist, erhöhen wir seine Nutzung
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            individual_usage: senderProfile.individual_usage + amount
          })
          .eq('id', session.user.id);

        if (updateError) throw updateError;
      } else {
        // Wenn der Sender kein Einzelnutzer ist, müssen wir prüfen, ob er zu einem Team gehört
        // und die entsprechenden Kredite aktualisieren
        // Diese Logik würde komplexer sein und hängt von Ihrer spezifischen Implementierung ab
      }

      Alert.alert('Erfolg', `${amount} Mana wurden erfolgreich an ${foundUser.email} gesendet.`);
      
      // Formular zurücksetzen
      setRecipientEmail('');
      setManaAmount('');
      setDescription('');
      setFoundUser(null);
      
      // Aktualisiere die Kredite des Benutzers
      fetchUserCredits(session.user.id);
    } catch (error) {
      console.error('Fehler beim Senden von Mana:', error);
      Alert.alert('Fehler', 'Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  }

  // Dynamische Stile basierend auf dem aktuellen Theme
  const styles = StyleSheet.create({
    container: {
      backgroundColor: isDarkMode ? '#1E1E1E' : 'white',
      borderRadius: 10,
      padding: 20,
      marginBottom: 20,
      shadowColor: isDarkMode ? '#000000' : '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.5 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    header: {
      fontSize: 22,
      fontWeight: 'bold',
      marginBottom: 20,
      color: isDarkMode ? '#F9FAFB' : '#333',
    },
    creditInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#1E3A8A' : '#f0f8ff',
      padding: 15,
      borderRadius: 8,
      marginBottom: 20,
    },
    creditLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: isDarkMode ? '#E5E7EB' : '#333',
    },
    creditAmount: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDarkMode ? '#93C5FD' : '#0055FF',
      marginLeft: 10,
    },
    formGroup: {
      marginBottom: 15,
    },
    label: {
      fontSize: 16,
      marginBottom: 8,
      fontWeight: '500',
      color: isDarkMode ? '#E5E7EB' : '#333',
    },
    input: {
      height: 50,
      borderWidth: 1,
      borderColor: isDarkMode ? '#4B5563' : '#ddd',
      borderRadius: 8,
      paddingHorizontal: 15,
      backgroundColor: isDarkMode ? '#374151' : '#f9f9f9',
      fontSize: 16,
      color: isDarkMode ? '#F9FAFB' : '#333',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    searchInput: {
      flex: 1,
      height: 50,
      borderWidth: 1,
      borderColor: isDarkMode ? '#4B5563' : '#ddd',
      borderRadius: 8,
      paddingHorizontal: 15,
      backgroundColor: isDarkMode ? '#374151' : '#f9f9f9',
      fontSize: 16,
      color: isDarkMode ? '#F9FAFB' : '#333',
    },
    searchButton: {
      backgroundColor: isDarkMode ? '#3B82F6' : '#0055FF',
      height: 50,
      paddingHorizontal: 15,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 10,
    },
    searchButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: 'bold',
    },
    userCard: {
      backgroundColor: isDarkMode ? '#1E3A8A' : '#f0f8ff',
      padding: 15,
      borderRadius: 8,
      marginBottom: 20,
      borderLeftWidth: 4,
      borderLeftColor: isDarkMode ? '#3B82F6' : '#0055FF',
    },
    userCardTitle: {
      fontSize: 14,
      color: isDarkMode ? '#9CA3AF' : '#666',
      marginBottom: 5,
    },
    userCardEmail: {
      fontSize: 16,
      fontWeight: 'bold',
      color: isDarkMode ? '#F9FAFB' : '#333',
    },
    userCardName: {
      fontSize: 14,
      color: isDarkMode ? '#9CA3AF' : '#666',
      marginTop: 5,
    },
    sendButton: {
      backgroundColor: isDarkMode ? '#3B82F6' : '#0055FF',
      height: 50,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 10,
    },
    sendButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    },
    disabledButton: {
      backgroundColor: isDarkMode ? '#4B5563' : '#ccc',
    },
    notLoggedIn: {
      fontSize: 16,
      color: isDarkMode ? '#9CA3AF' : '#666',
      textAlign: 'center',
      padding: 20,
    },
  });

  if (!session) {
    return (
      <View style={styles.container}>
        <Text style={styles.notLoggedIn}>
          Bitte melden Sie sich an, um Mana zu senden.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Mana senden</Text>
      
      <View style={styles.creditInfo}>
        <Text style={styles.creditLabel}>Verfügbares Mana:</Text>
        <Text style={styles.creditAmount}>{userCredits}</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Empfänger E-Mail</Text>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={recipientEmail}
            onChangeText={setRecipientEmail}
            placeholder="E-Mail des Empfängers"
            placeholderTextColor={isDarkMode ? '#9CA3AF' : '#9CA3AF'}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={searchUser}
            disabled={searchLoading}
          >
            {searchLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.searchButtonText}>Suchen</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {foundUser && (
        <View style={styles.userCard}>
          <Text style={styles.userCardTitle}>Empfänger gefunden:</Text>
          <Text style={styles.userCardEmail}>{foundUser.email}</Text>
          {(foundUser.first_name || foundUser.last_name) && (
            <Text style={styles.userCardName}>
              {[foundUser.first_name, foundUser.last_name].filter(Boolean).join(' ')}
            </Text>
          )}
        </View>
      )}

      <View style={styles.formGroup}>
        <Text style={styles.label}>Mana-Betrag</Text>
        <TextInput
          style={styles.input}
          value={manaAmount}
          onChangeText={setManaAmount}
          placeholder="Betrag eingeben"
          placeholderTextColor={isDarkMode ? '#9CA3AF' : '#9CA3AF'}
          keyboardType="number-pad"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Beschreibung (optional)</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="Grund für die Übertragung"
          placeholderTextColor={isDarkMode ? '#9CA3AF' : '#9CA3AF'}
          multiline
        />
      </View>

      <TouchableOpacity
        style={[
          styles.sendButton,
          (!foundUser || loading) && styles.disabledButton
        ]}
        onPress={sendMana}
        disabled={!foundUser || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.sendButtonText}>Mana senden</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  creditInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  creditLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  creditAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0055FF',
    marginLeft: 10,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
    color: '#333',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#0055FF',
    height: 50,
    paddingHorizontal: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  searchButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  userCard: {
    backgroundColor: '#f0f8ff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#0055FF',
  },
  userCardTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  userCardEmail: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userCardName: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  sendButton: {
    backgroundColor: '#0055FF',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  notLoggedIn: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
});
