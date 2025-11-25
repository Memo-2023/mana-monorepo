import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '~/utils/supabase';
import { logger } from '~/utils/logger';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureProfile = async (user: User) => {
    console.log('🔍 Checking if profile exists for:', user.id);

    // Test basic Supabase connectivity first
    try {
      console.log('🧪 Testing Supabase connection...');
      const testStart = Date.now();
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      const testDuration = Date.now() - testStart;
      console.log('🧪 Test query completed in', testDuration, 'ms', { hasData: !!testData, error: testError?.message });
    } catch (e) {
      console.error('🧪 Test query failed:', e);
    }

    // Check if profile exists
    console.log('🔍 Fetching user profile...');
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();
    console.log('🔍 Profile query done:', { hasProfile: !!profile, error: error?.message });

    if (error) {
      console.log('⚠️ Profile check error:', error.message, '- Will try to create');
    }

    // If profile doesn't exist, create it
    if (error || !profile) {
      console.log('➕ Creating profile for user:', user.id);
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
        });

      if (insertError) {
        console.error('❌ Error creating profile:', insertError);
        logger.error('Error creating profile:', insertError);
      } else {
        console.log('✅ Profile created successfully');
      }
    } else {
      console.log('✅ Profile already exists');
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      console.log('🔐 Initial session check:', {
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        error: error?.message,
      });
      logger.debug('Initial session check:', { hasSession: !!session, error });
      setSession(session);
      setLoading(false); // Set loading to false IMMEDIATELY - don't wait for ensureProfile

      // Ensure profile in background (don't block)
      if (session?.user) {
        ensureProfile(session.user).catch(err => {
          console.error('Error ensuring profile:', err);
        });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state change:', {
        event,
        userId: session?.user?.id,
        email: session?.user?.email,
      });
      logger.debug('Auth state change:', event, session?.user?.id);
      setSession(session);
      setLoading(false); // Set loading to false IMMEDIATELY - don't wait for ensureProfile

      // Ensure profile in background (don't block)
      if (session?.user) {
        ensureProfile(session.user).catch(err => {
          console.error('Error ensuring profile:', err);
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    logger.info('Signing out...');

    // Add timeout to prevent hanging
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Sign out timeout after 5s')), 5000)
    );

    try {
      const signOutPromise = supabase.auth.signOut();
      const { error } = await Promise.race([signOutPromise, timeout]) as any;

      if (error) {
        logger.error('Error signing out:', error);
        throw error;
      } else {
        logger.success('Successfully signed out');
        setSession(null);
        setLoading(false);
      }
    } catch (error: any) {
      // If timeout or error, force logout anyway
      logger.error('Sign out failed, forcing local logout:', error);
      setSession(null);
      setLoading(false);
      // Don't throw - we want to force logout even if API fails
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return safe defaults during initial render before provider is ready
    // This prevents crashes with expo-router's eager rendering
    return {
      user: null,
      loading: true,
      signOut: async () => {},
    };
  }
  return context;
};