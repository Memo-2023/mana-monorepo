# Memoro App

**AI-powered voice recording and memo management application** built with React Native and Expo. Memoro transforms audio recordings into structured, searchable content using artificial intelligence and provides collaborative workspace features.

## 🎯 What It Does

- **Audio Recording**: High-quality recording with background support and real-time transcription
- **AI Processing**: Transform recordings into structured content using customizable Blueprints and Prompts
- **Collaborative Spaces**: Share and organize memos within team workspaces
- **Multi-Language Support**: 32 languages with automatic device detection
- **Credit System**: Mana-based pricing for AI operations with transparent costs
- **Cross-Platform**: Native iOS, Android, and responsive Web support

## 📱 Current Version

- **App Version**: 2.0.3
- **iOS Build**: 417
- **Android Build**: 416
- **Bundle ID**: `com.memo.beta`

## 🛠 Technology Stack

### Core Framework
- **React Native**: 0.79.2
- **Expo SDK**: 53.0.6
- **React**: 19.0.0
- **TypeScript**: Latest

### Navigation & UI
- **Expo Router**: 5.0.4 (file-based routing)
- **NativeWind**: 4.1.23 (Tailwind CSS for React Native)
- **React Native Reanimated**: 3.17.4

### State Management
- **Zustand**: 5.0.4 (global state)
- **React Context**: Feature-specific state management

### Backend Integration
- **Supabase**: 2.49.4 (database, storage, real-time)
- **Custom JWT Middleware**: Authentication bridge
- **Azure Speech Services**: Audio transcription

### Platform Features
- **Audio**: expo-audio 1.0.13 (migrated from expo-av)
- **Maps**: react-native-maps 1.20.1
- **Subscriptions**: react-native-purchases 8.10.1 (RevenueCat)
- **Analytics**: posthog-react-native 3.16.1
- **Notifications**: @notifee/react-native 9.1.8
- **Markdown**: react-native-markdown-display 7.0.2

## 📁 Project Structure

```
memoro_app/
├── app/                     # Expo Router navigation
│   ├── (public)/           # Unauthenticated routes
│   │   ├── login.tsx       # Multi-provider authentication
│   │   └── register.tsx    # User registration
│   ├── (protected)/        # Authenticated routes
│   │   ├── (tabs)/         # Main navigation tabs
│   │   │   ├── index.tsx   # Recording screen
│   │   │   ├── memos.tsx   # Memo management
│   │   │   └── spaces.tsx  # Space collaboration
│   │   ├── (memo)/[id].tsx # Dynamic memo details
│   │   ├── (space)/[id].tsx # Space details
│   │   └── settings.tsx    # App configuration
│   └── modal.tsx           # Modal presentations
├── components/             # Atomic design system
│   ├── atoms/             # Basic UI components (16 components)
│   ├── molecules/         # Composite components (21 components)
│   ├── organisms/         # Complex components (9 components)
│   └── statistics/        # Analytics components (14 components)
├── features/              # Feature-based architecture
│   ├── auth/             # Authentication system
│   ├── audioRecording/   # Recording functionality
│   ├── spaces/           # Collaboration features
│   ├── credits/          # Mana credit system
│   ├── i18n/             # Internationalization
│   ├── subscription/     # RevenueCat integration
│   └── theme/            # Theme system & Markdown styles
├── content/              # Dynamic content system
│   ├── blueprints/       # AI analysis patterns
│   ├── categories/       # Content organization (8 categories)
│   └── prompts/          # AI task templates
└── docs/                 # Documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI
- iOS Simulator / Android Emulator
- Xcode (for iOS development)
- Android Studio (for Android development)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd memoro_app

# Install dependencies
npm install

# Install iOS dependencies (macOS only)
cd ios && pod install && cd ..

# Start development server
npm start
```

### Development Commands

```bash
# Start Expo development server
npm start

# iOS development
npm run ios

# Android development  
npm run android

# Web development
npm run web

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🏗 Build & Deployment

### EAS Build Configuration

```bash
# Development build
eas build --profile development

# Preview build
eas build --profile preview

# Production build
eas build --profile production
```

### Build Profiles
- **Development**: Development client with debugging enabled
- **Preview**: Internal distribution with app bundle (Android)
- **Production**: Auto-increment version, store-ready builds

### Platform Support
- **iOS**: App Store deployment with proper entitlements
- **Android**: Google Play with adaptive icons
- **Web**: Netlify deployment with static export

## 🎨 Design System

### Atomic Design Architecture
- **Atoms**: Button, Text, Icon, Input, Toggle (16 components)
- **Molecules**: MemoPreview, RecordingBar, TagSelector (21 components)  
- **Organisms**: AudioRecorder, Memory, TranscriptDisplay (9 components)
- **Statistics**: Specialized analytics components (14 components)

### Theme System
- **Multiple Variants**: Light, dark, and custom themes
- **Dynamic Switching**: Real-time theme changes
- **System Detection**: Automatic dark/light mode
- **Color System**: Comprehensive Tailwind-based palette

### Markdown Support
- **Rich Text Display**: Full Markdown rendering in memos
- **Hybrid Rendering**: Automatic detection of Markdown syntax
- **Theme Integration**: Markdown styles adapt to dark/light mode
- **Supported Features**: Headers, bold, italic, links, code blocks, lists, quotes, tables
- **Centralized Styles**: Configurable through `features/theme/markdownStyles.ts`

## 🌍 Internationalization

### Supported Languages (32)
Arabic, Bengali, Bulgarian, Chinese, Czech, Danish, Dutch, English, Estonian, Finnish, French, Gaelic, German, Greek, Hindi, Croatian, Hungarian, Indonesian, Italian, Japanese, Korean, Lithuanian, Latvian, Maltese, Norwegian, Persian, Polish, Portuguese, Romanian, Russian, Serbian, Slovak, Slovenian, Spanish, Swedish, Turkish, Ukrainian, Urdu, Vietnamese

### Features
- **Automatic Detection**: Device language detection with fallback
- **Persistent Preferences**: User language choice storage
- **RTL Support**: Right-to-left languages (Arabic, Hebrew)
- **Complete Translations**: All UI elements localized

## 🎙 Audio Features

### Recording Capabilities
- **High-Quality Recording**: M4A format with AAC encoding
- **Background Recording**: Proper iOS/Android permissions
- **Pause/Resume**: Seamless recording control
- **Real-Time Monitoring**: Audio level metering
- **Crash Recovery**: Automatic segmentation prevents data loss

### Processing Pipeline
- **Cloud Storage**: Supabase Storage integration
- **Azure Transcription**: Speaker labeling and timestamps
- **AI Analysis**: Custom backend processing
- **Real-Time Updates**: Live processing status
- **Error Recovery**: Comprehensive retry mechanisms

## 🤖 AI Processing System

### Blueprints
Reusable AI analysis patterns for different use cases:
- **Text Analysis**: Content structure and insights
- **Creative Writing**: Literary analysis and suggestions
- **Meeting Notes**: Action items and summaries
- **Research**: Citation and reference extraction

### Prompts  
Specific AI tasks for content transformation:
- **Summary**: Concise content overview
- **To-Do**: Action item extraction
- **Translation**: Multi-language support
- **Question Answering**: Interactive content exploration

### Categories (8)
- Coaching, Crafts, Healthcare, Journal, Journalism, Office, Sales, University

## 💰 Subscription & Credits

### Mana Credit System
- **Transparent Pricing**: Backend-driven cost calculation
- **Real-Time Validation**: Pre-operation credit checks
- **Usage Tracking**: Comprehensive consumption analytics
- **Credit Sharing**: Team-based credit pools

### Subscription Tiers
- **Free**: 150 Mana, 5 daily Mana
- **Individual Plans**: Stream (€5.99), River (€14.99), Lake (€29.99), Ocean (€49.99)
- **Team Plans**: Collaborative features with shared credits
- **Enterprise**: Advanced features and support

### RevenueCat Integration
- **Cross-Platform**: iOS, Android, Web support
- **Purchase Management**: Subscription lifecycle handling
- **User Identification**: Authentication system integration
- **Restoration**: Cross-device purchase recovery

## 🏢 Collaborative Spaces

### Team Features
- **Space Creation**: Unlimited collaborative workspaces
- **Member Management**: Role-based permissions
- **Memo Sharing**: Seamless content collaboration
- **Invitation System**: Email-based team invites
- **Access Control**: Row-level security policies

### Integration
- **Backend API**: RESTful space management
- **Real-Time Sync**: Live collaboration updates
- **Credit Pools**: Shared team resources
- **Analytics**: Team usage insights

## 🔐 Security & Authentication

### Multi-Provider Authentication
- **Email/Password**: Traditional authentication
- **Google Sign-In**: OAuth integration
- **Apple Sign-In**: iOS native authentication
- **JWT Tokens**: Custom middleware integration

### Data Security
- **Row Level Security**: Database-level access control
- **Token Rotation**: Automatic refresh mechanisms
- **Secure Storage**: Platform-specific secure storage
- **Permission System**: Granular access controls

## 📊 Analytics & Monitoring

### User Analytics
- **PostHog Integration**: Comprehensive event tracking
- **User Identification**: Authentication-linked analytics
- **Feature Usage**: Detailed interaction metrics
- **Performance Monitoring**: App performance insights

### Error Handling
- **Graceful Degradation**: Offline functionality
- **Retry Mechanisms**: Network failure recovery
- **User Feedback**: Comprehensive error messaging
- **Crash Reporting**: Production error tracking

## 🔧 Development & Testing

### Code Quality
- **TypeScript Strict**: Type safety enforcement
- **ESLint & Prettier**: Code quality standards
- **Atomic Design**: Consistent component architecture
- **Documentation**: Comprehensive README files

### Development Tools
- **Expo Development Build**: Native debugging
- **Metro Bundler**: Asset optimization
- **Hot Reload**: Fast development iteration
- **Platform Testing**: iOS/Android/Web testing

## 📚 Additional Documentation

For more detailed information, see:
- **CLAUDE.md**: Development notes and context
- **docs/**: Feature-specific documentation
- **ReadMe/**: Legacy documentation archive
- **features/*/README.md**: Feature-specific guides

## 🌟 Key Features Summary

1. **Enterprise-Ready**: Production-scale architecture with comprehensive error handling
2. **International**: 32-language support with RTL compatibility  
3. **Modern Stack**: Latest React Native patterns with Expo Router
4. **AI-Powered**: Sophisticated content processing and analysis
5. **Collaborative**: Team-based workspaces with real-time sync
6. **Cross-Platform**: Native iOS, Android, and responsive web
7. **Subscription-Ready**: Complete RevenueCat integration
8. **Secure**: Multi-provider auth with JWT tokens
9. **Rich Content**: Markdown support with theme-aware styling

Memoro represents a sophisticated, production-ready application that successfully combines audio recording, AI processing, and collaborative productivity tools while maintaining high code quality and user experience standards across multiple platforms.