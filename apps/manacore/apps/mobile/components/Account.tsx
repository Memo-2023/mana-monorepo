import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../utils/supabase';
import { Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  is_individual: boolean;
  individual_quota: number;
  individual_usage: number;
}

export default function Account({ session }: { session: Session }) {
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (session) getProfile();
  }, [session]);

  async function getProfile() {
    try {
      setLoading(true);
      const { user } = session;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setProfile(data);
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Fehler beim Laden des Profils', error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile() {
    try {
      setLoading(true);
      const { user } = session;

      // Prüfen, ob das Profil bereits existiert
      if (!profile) {
        // Erstelle ein neues Profil, wenn es noch nicht existiert
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              first_name: firstName,
              last_name: lastName,
              is_individual: true, // Standardmäßig als Einzelnutzer
              individual_quota: 0,
              individual_usage: 0,
            },
          ]);

        if (insertError) throw insertError;
      } else {
        // Aktualisiere das bestehende Profil
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            first_name: firstName,
            last_name: lastName,
            updated_at: new Date(),
          })
          .eq('id', user.id);

        if (updateError) throw updateError;
      }

      Alert.alert('Erfolg', 'Profil erfolgreich aktualisiert!');
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Fehler beim Aktualisieren des Profils', error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Fehler beim Abmelden', error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileContainer}>
        <Text style={styles.header}>Mein Profil</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>E-Mail</Text>
          <Text style={styles.value}>{session?.user?.email}</Text>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Vorname</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Vorname eingeben"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Nachname</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Nachname eingeben"
          />
        </View>

        {profile && profile.is_individual && (
          <View style={styles.quotaContainer}>
            <Text style={styles.label}>Verfügbare Kredite</Text>
            <Text style={styles.quota}>
              {profile.individual_quota - profile.individual_usage} / {profile.individual_quota}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={updateProfile}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Wird aktualisiert...' : 'Profil aktualisieren'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.signOutButton]}
          onPress={signOut}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Abmelden</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  profileContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    color: '#666',
    paddingVertical: 10,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
  },
  quotaContainer: {
    marginVertical: 15,
    padding: 15,
    backgroundColor: '#f0f8ff',
    borderRadius: 5,
  },
  quota: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0055FF',
  },
  button: {
    backgroundColor: '#0055FF',
    height: 50,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signOutButton: {
    backgroundColor: '#ff3b30',
    marginTop: 10,
  },
});
