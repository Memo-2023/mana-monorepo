# Memoro App - Detailed Technical Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Development Setup](#development-setup)
4. [Navigation & Routing](#navigation--routing)
5. [Feature Modules](#feature-modules)
6. [State Management](#state-management)
7. [UI Components](#ui-components)
8. [Audio System](#audio-system)
9. [Authentication](#authentication)
10. [Credit System](#credit-system)
11. [Real-time Features](#real-time-features)
12. [Internationalization](#internationalization)
13. [Platform-Specific Code](#platform-specific-code)
14. [Testing](#testing)
15. [Performance Optimization](#performance-optimization)
16. [Build & Deployment](#build--deployment)
17. [Troubleshooting](#troubleshooting)

## Project Overview

### Purpose
Memoro App is a cross-platform mobile and web application that provides AI-powered voice recording, transcription, and content management. It serves as the primary user interface for the Memoro ecosystem, offering collaborative features and multi-language support.

### Tech Stack
- **Framework**: React Native 0.79.2
- **Platform**: Expo SDK 53.0.6
- **Language**: TypeScript 5.x
- **Navigation**: Expo Router 5.0.4 (File-based)
- **Styling**: NativeWind 4.1.23 (Tailwind CSS)
- **State**: Zustand 5.0.4 + React Context

### Key Dependencies
```json
{
  "react": "19.0.0",
  "react-native": "0.79.2",
  "expo": "^53.0.6",
  "expo-router": "5.0.4",
  "@supabase/supabase-js": "^2.49.4",
  "zustand": "^5.0.4",
  "nativewind": "^4.1.23",
  "react-native-reanimated": "~3.17.4",
  "expo-audio": "~1.0.13",
  "react-native-purchases": "^8.10.1"
}
```

## Architecture

### Application Structure
```
memoro_app/
├── app/                        # Navigation & Screens
│   ├── (public)/              # Unauthenticated routes
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (protected)/           # Authenticated routes
│   │   ├── (tabs)/           # Tab navigation
│   │   │   ├── _layout.tsx   # Tab configuration
│   │   │   ├── index.tsx     # Recording screen
│   │   │   └── memos.tsx     # Memo list
│   │   ├── (memo)/
│   │   │   └── [id].tsx      # Dynamic memo details
│   │   └── settings.tsx      # Settings screen
│   └── _layout.tsx            # Root layout
│
├── features/                   # Feature modules
│   ├── auth/                 # Authentication
│   ├── audioRecording/       # Recording system
│   ├── credits/              # Credit management
│   ├── spaces/               # Collaboration
│   └── i18n/                 # Translations
│
├── components/                 # UI Components
│   ├── atoms/                # Basic components
│   ├── molecules/            # Composite components
│   └── organisms/            # Complex components
│
└── utils/                     # Utilities
```

### Data Flow Architecture
```typescript
// Unidirectional data flow
User Action → Store/Context → API Call → Backend → Store Update → UI Update

// Example flow
Recording Button Press
    ↓
RecordingStore.startRecording()
    ↓
AudioService.startRecording()
    ↓
Platform API (AVAudioRecorder/MediaRecorder)
    ↓
Store Update (isRecording: true)
    ↓
UI Re-render
```

## Development Setup

### Prerequisites
```bash
# Required software
- Node.js >= 18.0.0
- npm >= 9.0.0
- Expo CLI
- iOS Simulator (Mac only)
- Android Studio (for Android development)
- Xcode (for iOS development)
```

### Initial Setup
```bash
# 1. Clone repository
git clone <repository-url>
cd memoro_app

# 2. Install dependencies
npm install

# 3. Install iOS dependencies (Mac only)
cd ios && pod install && cd ..

# 4. Configure environment
cp .env.example .env
# Edit .env with your configuration

# 5. Start development server
npm start

# 6. Run on platform
npm run ios      # iOS Simulator
npm run android  # Android Emulator
npm run web      # Web Browser
```

### Environment Configuration
```typescript
// config.ts
const ENV = {
  development: {
    API_URL: 'http://localhost:3001',
    SUPABASE_URL: 'https://dev.supabase.co',
    SUPABASE_ANON_KEY: 'dev-anon-key',
    REVENUECAT_API_KEY: 'dev-rc-key'
  },
  staging: {
    API_URL: 'https://staging-api.memoro.app',
    SUPABASE_URL: 'https://staging.supabase.co',
    SUPABASE_ANON_KEY: 'staging-anon-key',
    REVENUECAT_API_KEY: 'staging-rc-key'
  },
  production: {
    API_URL: 'https://api.memoro.app',
    SUPABASE_URL: 'https://prod.supabase.co',
    SUPABASE_ANON_KEY: 'prod-anon-key',
    REVENUECAT_API_KEY: 'prod-rc-key'
  }
};

export default ENV[process.env.NODE_ENV || 'development'];
```

## Navigation & Routing

### Expo Router Configuration
```typescript
// app/_layout.tsx - Root layout
export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <Stack>
            <Stack.Screen name="(public)" options={{ headerShown: false }} />
            <Stack.Screen name="(protected)" options={{ headerShown: false }} />
          </Stack>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// app/(protected)/(tabs)/_layout.tsx - Tab navigation
export default function TabLayout() {
  const { t } = useLanguage();
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.recording'),
          tabBarIcon: ({ color }) => <Icon name="mic" color={color} size={24} />
        }}
      />
      <Tabs.Screen
        name="memos"
        options={{
          title: t('tabs.memos'),
          tabBarIcon: ({ color }) => <Icon name="list" color={color} size={24} />
        }}
      />
    </Tabs>
  );
}
```

### Dynamic Routing
```typescript
// app/(protected)/(memo)/[id].tsx
export default function MemoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [memo, setMemo] = useState<Memo | null>(null);

  useEffect(() => {
    loadMemo(id);
  }, [id]);

  return (
    <ScrollView>
      <MemoTitle memo={memo} />
      <TranscriptDisplay transcript={memo?.source?.transcript} />
      <MemoryList memories={memo?.memories} />
    </ScrollView>
  );
}
```

### Navigation Helpers
```typescript
// utils/navigation.ts
import { router } from 'expo-router';

export const navigation = {
  goToMemo: (id: string) => router.push(`/(protected)/(memo)/${id}`),
  goToSpace: (id: string) => router.push(`/(protected)/(space)/${id}`),
  goToSettings: () => router.push('/(protected)/settings'),
  goBack: () => router.back(),
  
  // Tab navigation
  switchTab: (tab: 'recording' | 'memos') => {
    router.push(`/(protected)/(tabs)/${tab === 'recording' ? '' : tab}`);
  }
};
```

## Feature Modules

### 1. Authentication Module

#### AuthContext Implementation
```typescript
// features/auth/contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

export const AuthProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
    const interval = setInterval(refreshTokenIfNeeded, 30 * 60 * 1000); // 30 minutes
    return () => clearInterval(interval);
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.signIn(email, password);
      await tokenManager.setTokens(response);
      setUser(response.user);
      
      // Initialize services after auth
      await initializeAuthenticatedServices(response.user);
    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeAuthenticatedServices = async (user: User) => {
    // Initialize RevenueCat if not B2B
    if (!authService.shouldDisableRevenueCat()) {
      await revenueCatManager.conditionalInitialize(user.id);
    }

    // Initialize real-time subscriptions
    await realtimeService.initialize();

    // Load user settings
    await settingsService.loadUserSettings();
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      signIn,
      signInWithGoogle,
      signInWithApple,
      signOut,
      refreshToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### Token Manager
```typescript
// features/auth/services/tokenManager.ts
class TokenManager {
  private static instance: TokenManager;
  private refreshPromise: Promise<void> | null = null;
  private tokens: TokenSet | null = null;

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  async getValidToken(): Promise<string> {
    if (!this.tokens) {
      throw new Error('Not authenticated');
    }

    if (this.isTokenExpired(this.tokens.appToken)) {
      await this.refreshToken();
    }

    return this.tokens.appToken;
  }

  async refreshToken(): Promise<void> {
    // Prevent concurrent refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performRefresh();
    
    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performRefresh(): Promise<void> {
    if (!this.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refreshToken: this.tokens.refreshToken
      })
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    await this.setTokens({
      ...this.tokens,
      appToken: data.appToken,
      refreshToken: data.refreshToken
    });
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000;
      const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
      return Date.now() > (expiryTime - bufferTime);
    } catch {
      return true;
    }
  }
}
```

### 2. Audio Recording Module

#### Recording Store
```typescript
// features/audioRecording/store/recordingStore.ts
interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioUri: string | null;
  waveform: number[];
  
  // Actions
  startRecording: () => Promise<void>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  discardRecording: () => void;
  uploadRecording: (metadata: RecordingMetadata) => Promise<Memo>;
}

const useRecordingStore = create<RecordingState>((set, get) => ({
  isRecording: false,
  isPaused: false,
  duration: 0,
  audioUri: null,
  waveform: [],

  startRecording: async () => {
    try {
      // Request permissions (using expo-audio)
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Microphone permission denied');
      }

      // Configure audio mode
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'doNotMix',
      });

      // Create and start recording with HIGH_QUALITY preset
      const recorder = new AudioRecorder(RecordingPresets.HIGH_QUALITY);
      await recorder.prepareToRecordAsync();
      recorder.record();
      
      set({ 
        isRecording: true,
        isPaused: false,
        recording 
      });

      // Start duration timer
      startDurationTimer();
      
      // Start waveform monitoring
      startWaveformMonitoring(recording);
    } catch (error) {
      handleRecordingError(error);
    }
  },

  stopRecording: async () => {
    const { recorder } = get();
    if (!recorder) return;

    try {
      await recorder.stop();
      const uri = recorder.uri;
      
      set({
        isRecording: false,
        isPaused: false,
        audioUri: uri
      });

      stopDurationTimer();
      stopWaveformMonitoring();

      return uri;
    } catch (error) {
      handleRecordingError(error);
    }
  },

  uploadRecording: async (metadata: RecordingMetadata) => {
    const { audioUri, duration } = get();
    if (!audioUri) throw new Error('No recording to upload');

    try {
      // Upload to Supabase Storage
      const fileName = `recordings/${Date.now()}.m4a`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio')
        .upload(fileName, {
          uri: audioUri,
          type: 'audio/m4a',
          name: fileName
        });

      if (uploadError) throw uploadError;

      // Process via backend
      const response = await fetch(`${API_URL}/memoro/process-uploaded-audio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await tokenManager.getValidToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filePath: fileName,
          duration,
          metadata: {
            ...metadata,
            recordingStartedAt: new Date().toISOString()
          }
        })
      });

      if (!response.ok) throw new Error('Processing failed');

      const memo = await response.json();
      
      // Reset recording state
      set({
        isRecording: false,
        duration: 0,
        audioUri: null,
        waveform: []
      });

      return memo;
    } catch (error) {
      handleUploadError(error);
    }
  }
}));
```

### 3. Credit Management Module

#### Credit Context
```typescript
// features/credits/CreditContext.tsx
interface CreditContextType {
  credits: number;
  maxCredits: number;
  isLoading: boolean;
  checkCredits: (amount: number) => boolean;
  consumeCredits: (amount: number, operation: string) => Promise<void>;
  refreshCredits: () => Promise<void>;
  subscribeToUpdates: () => void;
}

export const CreditProvider: React.FC = ({ children }) => {
  const [credits, setCredits] = useState(0);
  const [maxCredits, setMaxCredits] = useState(100000);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadCredits();
      subscribeToUpdates();
    }
  }, [user]);

  const loadCredits = async () => {
    try {
      const response = await creditService.getUserCredits();
      setCredits(response.current);
      setMaxCredits(response.maximum);
    } catch (error) {
      console.error('Failed to load credits:', error);
    }
  };

  const checkCredits = (amount: number): boolean => {
    return credits >= amount;
  };

  const consumeCredits = async (amount: number, operation: string) => {
    if (!checkCredits(amount)) {
      // Show insufficient credits modal
      insufficientCreditsStore.getState().showModal(amount, operation);
      throw new InsufficientCreditsError(amount, credits);
    }

    try {
      await creditService.consumeCredits(amount, operation);
      setCredits(prev => prev - amount);
    } catch (error) {
      // Revert optimistic update
      await loadCredits();
      throw error;
    }
  };

  const subscribeToUpdates = () => {
    // Subscribe to real-time credit updates
    const subscription = supabase
      .channel('credit-updates')
      .on('postgres_changes', 
        { 
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user?.id}`
        },
        (payload) => {
          if (payload.new.credits !== credits) {
            setCredits(payload.new.credits);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  return (
    <CreditContext.Provider value={{
      credits,
      maxCredits,
      isLoading: false,
      checkCredits,
      consumeCredits,
      refreshCredits: loadCredits,
      subscribeToUpdates
    }}>
      {children}
    </CreditContext.Provider>
  );
};
```

### 4. Spaces Module

#### Space Service
```typescript
// features/spaces/services/spaceService.ts
class SpaceService {
  async getSpaces(): Promise<Space[]> {
    const response = await authenticatedFetch('/memoro/spaces');
    return response.json();
  }

  async createSpace(data: CreateSpaceDto): Promise<Space> {
    const response = await authenticatedFetch('/memoro/spaces', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async inviteToSpace(spaceId: string, email: string): Promise<void> {
    await authenticatedFetch(`/memoro/spaces/${spaceId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async linkMemoToSpace(memoId: string, spaceId: string): Promise<void> {
    await authenticatedFetch('/memoro/link-memo', {
      method: 'POST',
      body: JSON.stringify({ memoId, spaceId })
    });
  }

  subscribeToSpaceUpdates(spaceId: string, callback: (update: any) => void) {
    return supabase
      .channel(`space:${spaceId}`)
      .on('broadcast', { event: 'memo-added' }, callback)
      .on('broadcast', { event: 'member-joined' }, callback)
      .subscribe();
  }
}
```

## State Management

### Zustand Stores

#### Global App Store
```typescript
// store/store.ts
interface AppState {
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Memos
  memos: Memo[];
  selectedMemo: Memo | null;
  
  // Filters
  filters: {
    tags: string[];
    dateRange: [Date, Date] | null;
    searchQuery: string;
  };
  
  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  loadMemos: () => Promise<void>;
  selectMemo: (memo: Memo) => void;
  updateFilter: (filter: Partial<AppState['filters']>) => void;
}

const useAppStore = create<AppState>((set, get) => ({
  isLoading: false,
  error: null,
  memos: [],
  selectedMemo: null,
  filters: {
    tags: [],
    dateRange: null,
    searchQuery: ''
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  loadMemos: async () => {
    set({ isLoading: true, error: null });
    try {
      const memos = await memoService.getMemos(get().filters);
      set({ memos, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  selectMemo: (memo) => set({ selectedMemo: memo }),

  updateFilter: (filter) => set(state => ({
    filters: { ...state.filters, ...filter }
  }))
}));
```

### React Context Pattern

```typescript
// Context for cross-cutting concerns
const LanguageContext = createContext<LanguageContextType>(null);
const ThemeContext = createContext<ThemeContextType>(null);
const LocationContext = createContext<LocationContextType>(null);

// Provider composition
export const AppProviders: React.FC = ({ children }) => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <LocationProvider>
          <AuthProvider>
            <CreditProvider>
              <SpaceProvider>
                {children}
              </SpaceProvider>
            </CreditProvider>
          </AuthProvider>
        </LocationProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};
```

## UI Components

### Atomic Design System

#### Atoms (Basic Components)
```typescript
// components/atoms/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  onPress,
  disabled,
  loading,
  children
}) => {
  const { theme } = useTheme();
  
  const styles = {
    primary: 'bg-primary text-white',
    secondary: 'bg-gray-200 text-gray-800',
    danger: 'bg-red-500 text-white'
  };

  const sizes = {
    small: 'px-3 py-1 text-sm',
    medium: 'px-4 py-2',
    large: 'px-6 py-3 text-lg'
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`
        rounded-lg
        ${styles[variant]}
        ${sizes[size]}
        ${disabled ? 'opacity-50' : ''}
        ${loading ? 'opacity-70' : ''}
      `}
    >
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text className="font-medium text-center">{children}</Text>
      )}
    </TouchableOpacity>
  );
};
```

#### Molecules (Composite Components)
```typescript
// components/molecules/MemoPreview.tsx
interface MemoPreviewProps {
  memo: Memo;
  onPress: () => void;
  showActions?: boolean;
}

export const MemoPreview: React.FC<MemoPreviewProps> = ({
  memo,
  onPress,
  showActions = true
}) => {
  const { t } = useLanguage();
  const formattedDate = formatDate(memo.created_at);

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-3 shadow-sm"
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white">
            {memo.title || t('memo.untitled')}
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {formattedDate} • {formatDuration(memo.source?.duration)}
          </Text>
          {memo.tags && memo.tags.length > 0 && (
            <View className="flex-row flex-wrap mt-2">
              {memo.tags.map(tag => (
                <Tag key={tag.id} tag={tag} />
              ))}
            </View>
          )}
        </View>
        
        {showActions && (
          <View className="flex-row gap-2">
            <IconButton icon="play" onPress={() => playAudio(memo)} />
            <IconButton icon="share" onPress={() => shareMemo(memo)} />
          </View>
        )}
      </View>
      
      {memo.source?.transcript && (
        <Text 
          className="text-gray-600 dark:text-gray-300 mt-2"
          numberOfLines={2}
        >
          {memo.source.transcript}
        </Text>
      )}
    </TouchableOpacity>
  );
};
```

#### Organisms (Complex Components)
```typescript
// components/organisms/AudioRecorder.tsx
export const AudioRecorder: React.FC = () => {
  const { 
    isRecording,
    isPaused,
    duration,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording
  } = useRecordingStore();
  
  const { t } = useLanguage();
  const { checkCredits } = useCredits();

  const handleStartRecording = async () => {
    // Check minimum credits
    if (!checkCredits(10)) {
      showInsufficientCreditsModal(10, 'recording');
      return;
    }

    await startRecording();
  };

  return (
    <View className="flex-1 justify-center items-center p-8">
      <WaveformVisualizer isActive={isRecording} />
      
      <Text className="text-3xl font-bold text-gray-900 dark:text-white mt-8">
        {formatDuration(duration)}
      </Text>

      <View className="flex-row gap-4 mt-12">
        {!isRecording ? (
          <RecordButton onPress={handleStartRecording} />
        ) : (
          <>
            <IconButton
              icon={isPaused ? 'play' : 'pause'}
              onPress={isPaused ? resumeRecording : pauseRecording}
              size="large"
            />
            <StopButton onPress={stopRecording} />
          </>
        )}
      </View>

      {isRecording && (
        <Text className="text-sm text-gray-500 mt-4">
          {t('recording.tap_to_pause')}
        </Text>
      )}
    </View>
  );
};
```

## Real-time Features

### Supabase Real-time Integration
```typescript
// features/realtime/realtimeService.ts
class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();

  async initialize() {
    // Subscribe to user's memos
    this.subscribeMemoUpdates();
    
    // Subscribe to spaces
    this.subscribeSpaceUpdates();
  }

  private subscribeMemoUpdates() {
    const userId = authService.getCurrentUserId();
    
    const channel = supabase
      .channel('memo-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'memos',
          filter: `user_id=eq.${userId}`
        },
        (payload) => this.handleMemoChange(payload)
      )
      .subscribe();

    this.channels.set('memo-updates', channel);
  }

  private handleMemoChange(payload: RealtimePostgresChangesPayload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case 'INSERT':
        useAppStore.getState().addMemo(newRecord as Memo);
        break;
      case 'UPDATE':
        useAppStore.getState().updateMemo(newRecord as Memo);
        break;
      case 'DELETE':
        useAppStore.getState().removeMemo(oldRecord.id);
        break;
    }
  }

  subscribeToMemo(memoId: string, callback: (update: any) => void) {
    const channel = supabase
      .channel(`memo:${memoId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'memos',
          filter: `id=eq.${memoId}`
        },
        callback
      )
      .subscribe();

    return () => channel.unsubscribe();
  }

  cleanup() {
    this.channels.forEach(channel => channel.unsubscribe());
    this.channels.clear();
  }
}
```

## Internationalization

### Language Configuration
```typescript
// features/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Import all translation files
import en from './translations/en.json';
import de from './translations/de.json';
import es from './translations/es.json';
// ... 29 more languages

const resources = {
  en: { translation: en },
  de: { translation: de },
  es: { translation: es },
  // ... more languages
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: Localization.locale.split('-')[0], // Device language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

export default i18n;
```

### Translation Usage
```typescript
// Using translations in components
const MyComponent: React.FC = () => {
  const { t, i18n } = useTranslation();

  return (
    <View>
      <Text>{t('welcome.title')}</Text>
      <Text>{t('welcome.message', { name: 'John' })}</Text>
      
      <Picker
        selectedValue={i18n.language}
        onValueChange={(lang) => i18n.changeLanguage(lang)}
      >
        {Object.keys(resources).map(lang => (
          <Picker.Item key={lang} label={languages[lang]} value={lang} />
        ))}
      </Picker>
    </View>
  );
};
```

## Platform-Specific Code

### iOS Specific
```typescript
// audioRecording.service.ios.ts
import {
  AudioRecorder,
  RecordingPresets,
  setAudioModeAsync,
  requestRecordingPermissionsAsync
} from 'expo-audio';

export class IOSAudioService {
  async configureAudioSession() {
    await setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      shouldDuckAndroid: false,
    });
  }

  async startBackgroundRecording() {
    // iOS specific background task
    const backgroundTask = await BackgroundFetch.registerTaskAsync(
      'audio-recording-task',
      {
        minimumInterval: 60,
        stopOnTerminate: false,
        startOnBoot: true,
      }
    );
  }
}
```

### Android Specific
```typescript
// audioRecording.service.android.ts
import * as TaskManager from 'expo-task-manager';

export class AndroidAudioService {
  async configureForegroundService() {
    await Notifications.setNotificationChannelAsync('recording', {
      name: 'Recording Service',
      importance: Notifications.AndroidImportance.HIGH,
      sound: false,
    });

    // Start foreground service for recording
    await TaskManager.defineTask('recording-service', ({ data, error }) => {
      if (error) {
        console.error('Recording service error:', error);
        return;
      }

      // Keep recording active
      return BackgroundFetch.BackgroundFetchResult.NewData;
    });
  }
}
```

### Web Specific
```typescript
// audioRecording.service.web.ts
export class WebAudioService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  async startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100,
      }
    });

    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    });

    this.mediaRecorder.ondataavailable = (event) => {
      this.audioChunks.push(event.data);
    };

    this.mediaRecorder.start(1000); // Collect data every second
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.audioChunks = [];
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    });
  }
}
```

## Testing

### Unit Testing
```typescript
// __tests__/components/Button.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../components/atoms/Button';

describe('Button Component', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <Button onPress={() => {}}>Click me</Button>
    );
    
    expect(getByText('Click me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Button onPress={onPressMock}>Click me</Button>
    );
    
    fireEvent.press(getByText('Click me'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('is disabled when loading', () => {
    const onPressMock = jest.fn();
    const { getByTestId } = render(
      <Button onPress={onPressMock} loading testID="button">
        Click me
      </Button>
    );
    
    fireEvent.press(getByTestId('button'));
    expect(onPressMock).not.toHaveBeenCalled();
  });
});
```

### Integration Testing
```typescript
// __tests__/features/auth.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuth } from '../features/auth/hooks/useAuth';
import { authService } from '../features/auth/services/authService';

jest.mock('../features/auth/services/authService');

describe('Authentication Flow', () => {
  it('signs in user successfully', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    authService.signIn.mockResolvedValue({
      user: mockUser,
      tokens: { appToken: 'token', refreshToken: 'refresh' }
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn('test@example.com', 'password');
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

## Performance Optimization

### React Native Performance
```typescript
// Memo list optimization with FlashList
import { FlashList } from '@shopify/flash-list';

const MemoList: React.FC = () => {
  const memos = useAppStore(state => state.memos);

  const renderMemo = useCallback(({ item }) => (
    <MemoPreview 
      key={item.id}
      memo={item}
      onPress={() => navigation.goToMemo(item.id)}
    />
  ), []);

  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <FlashList
      data={memos}
      renderItem={renderMemo}
      keyExtractor={keyExtractor}
      estimatedItemSize={120}
      ItemSeparatorComponent={() => <View className="h-2" />}
      ListEmptyComponent={<EmptyState />}
    />
  );
};
```

### Image Optimization
```typescript
import * as ImageManipulator from 'expo-image-manipulator';

const optimizeImage = async (uri: string): Promise<string> => {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1024 } }],
    { 
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG
    }
  );
  
  return result.uri;
};
```

### Bundle Size Optimization
```javascript
// metro.config.js
module.exports = {
  transformer: {
    minifierConfig: {
      keep_fnames: true,
      mangle: {
        keep_fnames: true,
      },
    },
  },
  resolver: {
    assetExts: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'mp3', 'm4a'],
  },
};

// babel.config.js - Remove console in production
module.exports = {
  plugins: [
    process.env.NODE_ENV === 'production' && 'transform-remove-console',
  ].filter(Boolean),
};
```

## Build & Deployment

### EAS Build Configuration
```json
// eas.json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      },
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "buildConfiguration": "Release"
      },
      "android": {
        "buildType": "app-bundle"
      }
    },
    "production": {
      "autoIncrement": true,
      "ios": {
        "buildConfiguration": "Release",
        "bundleIdentifier": "com.memoro.app"
      },
      "android": {
        "buildType": "app-bundle",
        "packageName": "com.memoro.app"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "123456789",
        "appleTeamId": "TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  }
}
```

### Build Commands
```bash
# Development build
eas build --profile development --platform ios
eas build --profile development --platform android

# Preview build for testing
eas build --profile preview --platform all

# Production build
eas build --profile production --platform all

# Submit to stores
eas submit --profile production --platform ios
eas submit --profile production --platform android
```

## Troubleshooting

### Common Issues

#### 1. Recording Permissions
```typescript
// Fix: Always check permissions before recording
const checkAndRequestPermissions = async (): Promise<boolean> => {
  const { status } = await Audio.getPermissionsAsync();
  
  if (status === 'granted') return true;
  
  const { status: newStatus } = await Audio.requestPermissionsAsync();
  
  if (newStatus !== 'granted') {
    Alert.alert(
      'Permission Required',
      'Microphone access is required for recording',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() }
      ]
    );
    return false;
  }
  
  return true;
};
```

#### 2. Token Expiration
```typescript
// Fix: Implement retry logic with token refresh
const authenticatedFetch = async (url: string, options?: RequestInit) => {
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      'Authorization': `Bearer ${await tokenManager.getValidToken()}`
    }
  });

  if (response.status === 401) {
    // Token expired, refresh and retry
    await tokenManager.refreshToken();
    
    response = await fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        'Authorization': `Bearer ${await tokenManager.getValidToken()}`
      }
    });
  }

  return response;
};
```

#### 3. Memory Leaks
```typescript
// Fix: Proper cleanup in useEffect
useEffect(() => {
  let isMounted = true;
  let subscription: RealtimeChannel;

  const setup = async () => {
    if (!isMounted) return;
    
    subscription = supabase
      .channel('updates')
      .on('postgres_changes', { event: '*' }, (payload) => {
        if (isMounted) {
          handleUpdate(payload);
        }
      })
      .subscribe();
  };

  setup();

  return () => {
    isMounted = false;
    subscription?.unsubscribe();
  };
}, []);
```

### Debug Tools

#### React Native Debugger
```javascript
// Enable debugging
if (__DEV__) {
  require('react-native-debugger');
  
  // Log all network requests
  global.XMLHttpRequest = global.originalXMLHttpRequest || global.XMLHttpRequest;
  
  // Enable network inspect
  import('./reactotron.config');
}
```

#### Performance Monitoring
```typescript
// Performance tracking
import { PerformanceObserver } from 'react-native-performance';

const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    console.log(`${entry.name}: ${entry.duration}ms`);
  });
});

observer.observe({ entryTypes: ['measure'] });

// Track operation
performance.mark('operation-start');
// ... operation code
performance.mark('operation-end');
performance.measure('operation', 'operation-start', 'operation-end');
```

### Crash Reporting

**Note:** Sentry has been removed from the app. If crash reporting is needed in the future, consider integrating a new error tracking service.

## Migration from expo-av to expo-audio

### Overview
As part of the Expo SDK 54 upgrade, we migrated from the deprecated `expo-av` package to the new `expo-audio` package. This change was necessary due to:
- `expo-av` being deprecated in Expo SDK 54
- Android 16 compatibility issues with the old audio API
- Better performance and simpler API with `expo-audio`

### Key Changes

#### 1. Package Installation
```bash
# Remove old package
npm uninstall expo-av

# Install new package
npm install expo-audio@~1.0.13
```

#### 2. API Changes

##### Recording
**Old (expo-av):**
```typescript
import { Audio } from 'expo-av';

const recording = new Audio.Recording();
await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
await recording.startAsync();
await recording.stopAndUnloadAsync();
const uri = recording.getURI();
```

**New (expo-audio):**
```typescript
import { AudioRecorder, RecordingPresets } from 'expo-audio';

const recorder = new AudioRecorder(RecordingPresets.HIGH_QUALITY);
await recorder.prepareToRecordAsync();
recorder.record(); // Synchronous
await recorder.stop();
const uri = recorder.uri;
```

##### Audio Playback
**Old (expo-av):**
```typescript
const { sound } = await Audio.Sound.createAsync({ uri });
await sound.playAsync();
await sound.pauseAsync();
await sound.stopAsync();
await sound.unloadAsync();
```

**New (expo-audio):**
```typescript
import { createAudioPlayer } from 'expo-audio';

const player = createAudioPlayer(uri);
await player.play();
await player.pause();
await player.stop();
player.release();
```

##### Audio Mode Configuration
**Old (expo-av):**
```typescript
await Audio.setAudioModeAsync({
  allowsRecordingIOS: true,
  playsInSilentModeIOS: true,
  staysActiveInBackground: true,
  interruptionModeIOS: InterruptionModeIOS.DoNotMix,
  interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
});
```

**New (expo-audio):**
```typescript
import { setAudioModeAsync } from 'expo-audio';

await setAudioModeAsync({
  allowsRecording: true,
  playsInSilentMode: true,
  shouldPlayInBackground: true,
  interruptionMode: 'doNotMix', // String instead of enum
});
```

### Android 16 Compatibility
The migration addresses several Android 16 specific issues:
- Foreground service restrictions for recording
- Audio focus handling improvements
- Permission model changes

### Known Issues
- **Expo SDK 54 Bug**: Zero-byte audio files may be created on some Android devices (GitHub issue #39646)
- **Workaround**: The app includes logging to detect and handle this edge case

### Benefits of expo-audio
1. **Simpler API**: More intuitive method names and patterns
2. **Better Performance**: Optimized for modern devices
3. **Type Safety**: Improved TypeScript definitions
4. **Future-Proof**: Active development and support from Expo team
5. **Smaller Bundle**: Reduced package size compared to expo-av