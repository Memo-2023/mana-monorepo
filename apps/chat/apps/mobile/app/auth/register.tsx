import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthProvider';
import { useAppTheme } from '../../theme/ThemeProvider';

export default function RegisterScreen() {
  const { colors } = useTheme();
  const { isDarkMode } = useAppTheme();
  const router = useRouter();
  const { signUp } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Fehler', 'Bitte fülle alle Felder aus.');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Fehler', 'Die Passwörter stimmen nicht überein.');
      return;
    }
    
    if (password.length < 6) {
      Alert.alert('Fehler', 'Das Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await signUp(email, password);
      
      if (error) {
        Alert.alert('Registrierung fehlgeschlagen', error.message);
      } else if (data?.user) {
        Alert.alert(
          'Registrierung erfolgreich', 
          'Dein Konto wurde erfolgreich erstellt. Du wirst jetzt angemeldet.',
          [
            { 
              text: 'OK', 
              onPress: () => router.replace('/')
            }
          ]
        );
      }
    } catch (error) {
      console.error('Fehler bei der Registrierung:', error);
      Alert.alert('Fehler', 'Bei der Registrierung ist ein Fehler aufgetreten. Bitte versuche es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Konto erstellen</Text>
        <Text style={[styles.subtitle, { color: colors.text + 'CC' }]}>
          Erstelle ein Konto, um mit KI-Modellen zu chatten
        </Text>
      </View>
      
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>E-Mail</Text>
          <View style={[
            styles.inputWrapper, 
            { 
              backgroundColor: isDarkMode ? '#2C2C2E' : '#F2F2F7',
              borderColor: isDarkMode ? '#3A3A3C' : '#E5E5EA'
            }
          ]}>
            <Ionicons name="mail-outline" size={20} color={colors.text + '80'} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="deine@email.de"
              placeholderTextColor={colors.text + '60'}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Passwort</Text>
          <View style={[
            styles.inputWrapper, 
            { 
              backgroundColor: isDarkMode ? '#2C2C2E' : '#F2F2F7',
              borderColor: isDarkMode ? '#3A3A3C' : '#E5E5EA'
            }
          ]}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.text + '80'} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Passwort"
              placeholderTextColor={colors.text + '60'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons 
                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color={colors.text + '80'} 
              />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Passwort bestätigen</Text>
          <View style={[
            styles.inputWrapper, 
            { 
              backgroundColor: isDarkMode ? '#2C2C2E' : '#F2F2F7',
              borderColor: isDarkMode ? '#3A3A3C' : '#E5E5EA'
            }
          ]}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.text + '80'} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Passwort bestätigen"
              placeholderTextColor={colors.text + '60'}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
            />
          </View>
        </View>
        
        <TouchableOpacity
          style={[
            styles.registerButton,
            { backgroundColor: colors.primary },
            loading && { opacity: 0.7 }
          ]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.registerButtonText}>Registrieren</Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.loginContainer}>
          <Text style={[styles.loginText, { color: colors.text + 'CC' }]}>
            Bereits ein Konto?
          </Text>
          <Link href="/auth/login" asChild>
            <TouchableOpacity>
              <Text style={[styles.loginLink, { color: colors.primary }]}>
                Anmelden
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  registerButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    marginRight: 4,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});
