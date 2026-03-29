# ULoad Feature Overview

**Date:** 2025-08-15-15:08

## Project Description

ULoad (ulo.ad) is a comprehensive link management and digital profile platform built with SvelteKit. The application combines URL shortening, link analytics, digital business cards, and customizable public profiles with a modern, themeable interface.

## Core Features

### 1. Link Management System

#### URL Shortening

- **Short Link Generation**: Create custom short URLs (ulo.ad/code)
- **Username-based URLs**: Personal branded links (ulo.ad/u/username/code)
- **Folder Organization**: Group links in themed folders with custom colors and icons
- **Tag System**: Organize links with customizable tags for better categorization
- **Link Features**:
  - Password protection for sensitive links
  - Expiration dates (automatic deactivation)
  - Maximum click limits
  - Link descriptions and titles
  - Active/inactive status toggle

#### Analytics Dashboard

- **Comprehensive Metrics**:
  - Total clicks tracking
  - Browser distribution (Chrome, Firefox, Safari, etc.)
  - Device type analytics (Desktop, Mobile, Tablet)
  - Referrer source tracking
  - Daily click patterns
  - Recent click history with detailed information
- **QR Code Generation**:
  - Multiple color options (black, white, gold)
  - Multiple formats (PNG, SVG, JPG)
  - Downloadable QR codes for each link

### 2. Digital Profile System

#### Public Profiles

- **Profile Pages**: Public profiles at /p/username
- **Profile Components**:
  - Profile information card with bio and social links
  - Link collections organized by folders
  - QR code for profile sharing
  - Click statistics display (optional)
  - Social media integration (GitHub, Twitter/X, LinkedIn, Instagram)

#### Profile Cards System

- **Three Creation Modes**:
  1. **Beginner Mode**: Visual drag-and-drop card builder
  2. **Advanced Mode**: Template-based creation with modules
  3. **Expert Mode**: Direct HTML/CSS editing

- **Card Modules**:
  - Header Module (title, subtitle, avatar)
  - Content Module (rich text content)
  - Links Module (link collections)
  - Media Module (images, videos)
  - Stats Module (statistics display)
  - Actions Module (CTA buttons)
  - Footer Module (additional information)

- **Card Features**:
  - Drag-and-drop reordering
  - Module-based composition
  - Custom themes and styling
  - Aspect ratio controls
  - Animation effects
  - Card duplication
  - Mode conversion between beginner/advanced/expert

### 3. Template Store

#### Community Templates

- **Template Marketplace**: Browse and use community-created card templates
- **Categories**: General, Profile, Dashboard, Widget templates
- **Template Features**:
  - Live preview before use
  - Download tracking
  - 5-star rating system
  - Tag-based search
  - Sort by popularity, recency, or rating
  - Template cloning to personal collection

#### Template Creation

- **Share Templates**: Create and publish templates for the community
- **Template Management**:
  - Public/private visibility
  - Template descriptions and tags
  - Module configuration
  - Preview images

### 4. Subscription & Pricing

#### Plan Tiers

1. **Free Plan**:
   - 10 links per month
   - Basic analytics
   - QR code generation
   - Link customization

2. **Pro Monthly (€4.99/month)**:
   - Unlimited links
   - Advanced analytics
   - Custom QR codes
   - Priority support
   - No advertisements
   - API access

3. **Pro Yearly (€39.99/year)**:
   - All Pro features
   - 20€ annual savings
   - Same benefits as monthly

4. **Lifetime (€129.99 one-time)**:
   - All Pro features forever
   - Early access to new features
   - Lifetime updates

#### Payment Integration

- **Stripe Integration**: Secure payment processing
- **Subscription Management**: Easy upgrade/downgrade
- **Checkout Flow**: Streamlined payment experience

### 5. User Management

#### Authentication System

- **Email/Password Authentication**: Standard registration and login
- **Email Verification**: Secure account activation
- **Password Reset**: Self-service password recovery
- **Session Management**: Persistent login with PocketBase

#### Settings & Preferences

- **Profile Settings**:
  - Username customization
  - Display name and bio
  - Location information
  - Social media links
- **Privacy Controls**:
  - Public/private profile toggle
  - Click statistics visibility
  - Email notification preferences
- **Account Management**:
  - Password changes
  - Email updates
  - Account deletion with confirmation
- **Default Preferences**:
  - Default link expiry settings
  - Notification preferences

### 6. Folder Management

#### Folder Features

- **Custom Folders**: Create folders for link organization
- **Folder Properties**:
  - URL-safe names for navigation
  - Display names for UI
  - Custom colors (10 preset options)
  - Icon support
  - Public/private visibility
  - Description fields

#### Folder Analytics

- **Metrics per Folder**:
  - Total links count
  - Aggregate click statistics
  - Folder-based link grouping on profiles

### 7. Tag System

#### Tag Management

- **Custom Tags**: Create personalized tags for organization
- **Tag Features**:
  - Custom icons
  - Color coding
  - Tag-based filtering
  - Multi-tag support per link
  - Tag search functionality

### 8. Theme System

#### Interface Theming

- **Dark/Light Mode**: System-wide theme switching
- **Custom Themes**: User-definable color schemes
- **Theme Components**:
  - Primary/secondary colors
  - Accent colors
  - Surface colors
  - Text color variations
  - Border and hover states

#### Card Themes

- **Card-specific Themes**: Individual styling for cards
- **Theme Editor**: Visual theme customization tool
- **Theme Inheritance**: Global and card-level theme options

### 9. Internationalization

#### Language Support

- **Multi-language Interface**: Powered by Paraglide.js
- **Supported Languages**: German and English (expandable)
- **Language Switching**: User-selectable interface language

### 10. Mobile Experience

#### Responsive Design

- **Mobile-optimized Layouts**: Adaptive UI for all screen sizes
- **Touch-friendly Interface**: Optimized for mobile interaction
- **Mobile Sidebar**: Collapsible navigation for mobile devices
- **PWA-ready**: Progressive Web App capabilities

## Technical Features

### Architecture

- **Framework**: SvelteKit 2.22 with Svelte 5.0
- **Database**: PocketBase (backend)
- **Styling**: Tailwind CSS 4.0
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Build Tool**: Vite
- **Deployment**: Node.js adapter

### Security Features

- **Password Protection**: Secure link access control
- **SSL Encryption**: HTTPS everywhere
- **Secure Authentication**: PocketBase auth system
- **CSRF Protection**: Built-in SvelteKit security

### Performance

- **Server-Side Rendering**: Fast initial page loads
- **Lazy Loading**: On-demand component loading
- **Optimized Assets**: Automatic image and code optimization
- **Caching Strategies**: Efficient data caching

### Developer Features

- **API Access**: Pro plan includes API access
- **TypeScript**: Full type safety
- **Component Library**: Reusable UI components
- **Testing Suite**: Comprehensive test coverage
- **Development Tools**: Hot reload, debugging support

## Unique Selling Points

1. **Three-Mode Card Builder**: Unique approach catering to all skill levels
2. **Integrated Link & Profile System**: Combines URL shortening with digital profiles
3. **Community Template Store**: Share and discover card designs
4. **Comprehensive Analytics**: Detailed insights without external tools
5. **Lifetime Plan Option**: One-time payment for permanent access
6. **Folder-based Organization**: Unique approach to link categorization
7. **Username-branded URLs**: Personal branding in short links
8. **Modular Card System**: Flexible, component-based card creation

## Future Expansion Possibilities

- Team/organization accounts
- Advanced API features
- Custom domain support
- Webhook integrations
- Advanced analytics (geographic data, conversion tracking)
- Social media auto-posting
- Bulk link operations
- Link scheduling
- A/B testing for links
- Browser extensions
