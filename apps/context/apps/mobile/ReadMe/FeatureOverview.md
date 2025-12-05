# BaseText Feature Overview

BaseText is a comprehensive React Native mobile application built with Expo that serves as an AI-powered text document management platform. This document provides a detailed overview of all implemented features and functionality.

## Core Features

### 1. Document Management System

#### Document Types

BaseText supports three distinct document types:

- **Text Documents**: Primary content documents used as input for AI processing
- **Context Documents**: Reference materials that provide background information for AI operations
- **Prompt Documents**: Reusable AI prompt templates for consistent interactions

#### Document Features

- **Auto-save Functionality**: Documents automatically save after 3 seconds of inactivity, preventing data loss
- **Version Control**: AI-generated content can be saved as new versions, maintaining a complete history
- **Pinning System**: Important documents can be pinned to appear at the top of lists
- **Short ID System**: User-friendly document references with prefix-based identifiers (e.g., T-001 for text documents)
- **Rich Metadata**: Support for tags, word count, token count, and custom metadata fields
- **Markdown Support**: Full markdown editing and preview capabilities
- **Mention System**: Reference other documents using @mentions or [[wiki-style]] links

### 2. Space Organization

#### Space Management

- **Hierarchical Organization**: Documents are organized within spaces for better structure
- **Space Pinning**: Frequently used spaces can be pinned for quick access
- **Inline Creation**: Create new spaces directly from the filter bar without modal interruptions
- **Custom Prefixes**: Each space can have unique document prefixes for better identification
- **Document Counters**: Separate counters for each document type within a space

#### Space Features

- **Filter Pills**: Visual filters for quick space selection on the home screen
- **Settings Management**: Custom configurations stored as JSONB for flexibility
- **Description Support**: Optional descriptions for better space documentation

### 3. AI Integration

#### Supported AI Models

- **Azure OpenAI**: GPT-4.1 and other OpenAI models via Azure infrastructure
- **Google Gemini**: Gemini Pro and other Google AI models

#### AI Features

- **Text Generation**: Create new content based on prompts and context documents
- **Text Continuation**: Seamlessly continue writing from any point in a document
- **Summarization**: Generate concise summaries of lengthy documents
- **Idea Generation**: Brainstorm new ideas based on existing content
- **Rewriting**: Transform text style while maintaining meaning
- **Custom Prompts**: Create and save reusable prompt templates

#### AI Assistant Interface

- **Bottom Toolbar**: Quick access to AI features while editing documents
- **Space-wide Generation**: Generate content using all documents in a space as context
- **Insertion Options**:
  - Insert at cursor position
  - Insert at beginning/end of document
  - Replace entire document
  - Create new version
- **Model Selection**: Choose between different AI models based on needs
- **Token Estimation**: Preview token usage before generating content

### 4. Token Economy & Monetization

#### Token System

- **Free Monthly Allowance**: 1 million tokens per month for all users
- **Token Balance Display**: Real-time token balance visible throughout the app
- **Usage Tracking**: Detailed tracking of token consumption by model and operation
- **Transaction History**: Complete audit trail of all token usage

#### Monetization Options

- **Subscriptions**:
  - Mini: 5M tokens/month (€4.99)
  - Plus: 10M tokens/month (€10.99)
  - Pro: 22M tokens/month (€17.99)
- **One-time Purchases**:
  - Small: 3M tokens (€4.99)
  - Medium: 7M tokens (€9.99)
  - Large: 15M tokens (€19.99)

#### RevenueCat Integration

- **In-app Purchases**: Seamless purchase flow for tokens
- **Receipt Validation**: Secure purchase verification
- **Subscription Management**: Auto-renewal and cancellation handling
- **Cross-platform Support**: Consistent experience on iOS and Android

### 5. Search and Filter System

#### Document Search

- **Full-text Search**: Search across document titles and content
- **Real-time Results**: Instant filtering as you type
- **Search Highlighting**: Matched terms highlighted in results

#### Advanced Filtering

- **Document Type Filters**: Filter by text, context, or prompt documents
- **Tag-based Filtering**: Multi-select tag filtering with AND logic
- **Space Filtering**: Single-select space filter for focused views
- **Combined Filters**: Use multiple filter types simultaneously

### 6. Tag System

#### Tag Management

- **Inline Tag Editor**: Add/remove tags directly in document editor
- **Tag Pills**: Visual tag display with overflow indicators
- **Tag Filtering**: Horizontal scrollable tag filter on space pages
- **Metadata Storage**: Tags stored in flexible JSONB structure

### 7. User Interface & Experience

#### Theme System

- **Dark/Light Modes**: Full theme support with system preference detection
- **Custom Theme Colors**: Configurable color schemes
- **Consistent Styling**: NativeWind (Tailwind CSS) for uniform appearance

#### Responsive Design

- **Mobile-first**: Optimized for phones and tablets
- **Desktop Support**: Adaptive layouts for larger screens
- **Web Compatibility**: Full web browser support via Expo

#### Navigation

- **Tab Navigation**: Main sections accessible via bottom tabs
- **Breadcrumb Navigation**: Clear hierarchical path display
- **Quick Actions**: Settings accessible from multiple locations
- **Gesture Support**: Swipe gestures for natural interactions

### 8. Authentication & Security

#### Supabase Authentication

- **Email/Password**: Traditional authentication method
- **Session Management**: Secure token handling with auto-refresh
- **Protected Routes**: Automatic redirection for unauthenticated users

#### Row Level Security (RLS)

- **Database-level Security**: Users can only access their own data
- **Secure by Default**: All queries filtered at database level
- **No Client-side Filtering**: Enhanced security and performance

### 9. Real-time Features

#### Live Updates

- **Document Synchronization**: Real-time updates across devices
- **Collaborative Potential**: Foundation for future collaboration features
- **Optimistic Updates**: Immediate UI updates with rollback on error

### 10. Document Comparison

#### Version Comparison

- **Side-by-side View**: Compare two document versions
- **Highlight Differences**: Visual indicators for changes
- **Navigation Controls**: Easy switching between versions

### 11. Import/Export Capabilities

#### Current Support

- **Markdown Import**: Direct markdown file support
- **Text Import**: Plain text file compatibility
- **Copy/Paste**: Standard clipboard operations

#### Planned Enhancements

- **PDF Export**: Generate formatted PDFs
- **Word Export**: Microsoft Word compatible files
- **Bulk Operations**: Import/export multiple documents

### 12. Performance Optimizations

#### Document Loading

- **Skeleton Screens**: Smooth loading transitions
- **Lazy Loading**: Load content as needed
- **Caching Strategy**: Local storage for offline access

#### Auto-save Optimization

- **Debounced Saves**: Reduce API calls with intelligent timing
- **Differential Updates**: Only save changed content
- **Background Sync**: Continue saving even when switching screens

### 13. Developer Experience

#### Code Architecture

- **Service Layer**: Clean separation of business logic
- **Type Safety**: Full TypeScript coverage
- **Component Library**: Reusable UI components
- **Error Boundaries**: Graceful error handling

#### Development Tools

- **Hot Reloading**: Instant preview of changes
- **Debug Context**: Development-specific tools
- **Console Logging**: Comprehensive debugging output

### 14. Deployment & Distribution

#### Web Deployment

- **Netlify Integration**: One-command web deployment
- **Environment Variables**: Secure configuration management
- **CDN Distribution**: Fast global content delivery

#### Mobile Deployment

- **EAS Build**: Cloud-based app building
- **Over-the-air Updates**: Push updates without app store review
- **TestFlight/Beta**: Easy distribution for testing

## Upcoming Features

Based on the NextSteps.md roadmap, the following features are planned:

1. **Enhanced Collaboration**: Real-time multi-user editing
2. **Advanced Search**: Semantic search with vector embeddings
3. **External Integrations**: YouTube transcripts, PDF import, Google Drive
4. **Offline Mode**: Full offline functionality with sync
5. **Public Sharing**: Share documents via public links
6. **Analytics Dashboard**: Usage statistics and insights
7. **Webhook Support**: Integration with external services
8. **API Access**: Developer API for third-party integrations

## Technical Stack

- **Frontend**: React Native with Expo
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **AI Services**: Azure OpenAI, Google Gemini
- **Payments**: RevenueCat
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React Context API
- **Deployment**: Netlify (web), EAS (mobile)

## Security Features

- **End-to-end Type Safety**: TypeScript throughout
- **SQL Injection Prevention**: Parameterized queries via Supabase
- **XSS Protection**: React's built-in protections
- **CORS Configuration**: Proper API access controls
- **Environment Variables**: Secure credential management

This comprehensive feature set makes BaseText a powerful platform for AI-assisted document management, suitable for writers, researchers, content creators, and anyone working with text-based content.
