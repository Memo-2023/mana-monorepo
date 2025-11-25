import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { Session, User } from '@supabase/supabase-js';
import { ActivityIndicator, View, Text } from 'react-native';

// Definiere den Typ für den Auth-Kontext
type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string) => Promise<{ error: any | null, data: any | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any | null }>;
};

// Erstelle den Auth-Kontext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook für den Zugriff auf den Auth-Kontext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// AuthProvider-Komponente
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialisiere den Auth-Status
  useEffect(() => {
    // Hole die aktuelle Session
    const getInitialSession = async () => {
      try {
        setLoading(true);
        
        // Prüfe, ob bereits eine Session existiert
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        
        // Abonniere Änderungen am Auth-Status
        const { data: { subscription } } = await supabase.auth.onAuthStateChange(
          (_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
          }
        );
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Fehler beim Initialisieren der Auth-Session:', error);
      } finally {
        setLoading(false);
      }
    };
    
    getInitialSession();
  }, []);

  // Anmelden mit E-Mail und Passwort
  const signIn = async (email: string, password: string) => {
    try {
      console.log('Versuche Anmeldung mit:', email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('Supabase Auth Fehler:', error.message, error.status);
        return { error };
      }
      
      console.log('Anmeldung erfolgreich:', data.user?.id);
      return { error: null };
    } catch (error: any) {
      console.error('Unerwarteter Fehler beim Anmelden:', error.message || error);
      return { error };
    }
  };

  // Registrieren mit E-Mail und Passwort
  const signUp = async (email: string, password: string) => {
    try {
      // Registriere den Benutzer mit autoConfirm=true, um die E-Mail-Bestätigung zu umgehen
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            email_confirmed: true
          }
        }
      });
      
      if (!error && data?.user) {
        // Wenn die Registrierung erfolgreich war, melde den Benutzer direkt an
        await signIn(email, password);
      }
      
      return { data, error };
    } catch (error) {
      console.error('Fehler beim Registrieren:', error);
      return { data: null, error };
    }
  };

  // Abmelden
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Fehler beim Abmelden:', error);
    }
  };

  // Passwort zurücksetzen
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'exp://localhost:8081/reset-password',
      });
      return { error };
    } catch (error) {
      console.error('Fehler beim Zurücksetzen des Passworts:', error);
      return { error };
    }
  };

  // Zeige Ladeindikator während der Initialisierung
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0A84FF" />
        <Text style={{ marginTop: 16 }}>Authentifizierung wird initialisiert...</Text>
      </View>
    );
  }

  // Stelle den Auth-Kontext bereit
  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
