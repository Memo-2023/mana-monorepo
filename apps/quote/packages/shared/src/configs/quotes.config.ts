/**
 * Default configuration for Quotes app
 */

import type { FullAppConfig, Quote } from '../types';

export const quotesAppConfig: FullAppConfig<Quote> = {
  metadata: {
    name: 'quotes',
    displayName: 'Zitate',
    description: 'Inspirierende Zitate von großen Denkern',
    version: '1.0.0',
    primaryLanguage: 'de',
    supportedLanguages: ['de', 'en'],
  },

  contentType: 'quote',
  contentLabel: {
    singular: 'Zitat',
    plural: 'Zitate',
  },
  authorLabel: {
    singular: 'Autor',
    plural: 'Autoren',
  },

  colors: {
    primary: '#667eea',
    secondary: '#764ba2',
    accent: '#f093fb',
  },

  features: {
    favorites: true,
    lists: true,
    sharing: true,
    search: true,
    filters: true,
    authors: true,
    categories: true,
    tags: true,
    dailyContent: true,
    notifications: true,
    widgets: true,
    cloudSync: true,
    premium: true,
  },

  display: {
    showAuthor: true,
    showDate: false,
    showSource: true,
    showCategory: true,
    showTags: true,
    cardStyle: 'detailed',
    swipeDirection: 'horizontal',
  },

  navigation: {
    tabs: [
      {
        id: 'quotes',
        label: 'Zitate',
        icon: 'quote',
        route: '/(tabs)',
        enabled: true,
      },
      {
        id: 'authors',
        label: 'Autoren',
        icon: 'person',
        route: '/(tabs)/authors',
        enabled: true,
      },
      {
        id: 'lists',
        label: 'Listen',
        icon: 'list',
        route: '/(tabs)/liste',
        enabled: true,
      },
      {
        id: 'favorites',
        label: 'Favoriten',
        icon: 'heart',
        route: '/(tabs)/myquotes',
        enabled: true,
      },
      {
        id: 'search',
        label: 'Suche',
        icon: 'search',
        route: '/(tabs)/search',
        enabled: true,
      },
    ],
    showTabBar: true,
    tabBarStyle: 'ios',
  },
};
