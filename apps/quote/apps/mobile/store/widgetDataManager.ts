import { Platform, NativeModules } from 'react-native';
import SharedGroupPreferences from 'react-native-shared-group-preferences';

const APP_GROUP = 'group.com.memoro.zitare.widget';

export interface WidgetQuote {
  quote: string;
  author: string;
  category?: string;
}

export interface WidgetPreferences {
  updateFrequency: 'hourly' | 'daily' | 'manual';
  categories: string[];
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
}

export class WidgetDataManager {
  /**
   * Save multiple quotes to the widget for random display
   */
  static async saveQuotesToWidget(quotes: WidgetQuote[]): Promise<void> {
    if (Platform.OS !== 'ios') return;
    
    try {
      const quotesData = JSON.stringify(quotes);
      await SharedGroupPreferences.setItem(
        'savedQuotes',
        quotesData,
        APP_GROUP
      );
      
      // Trigger widget update
      this.refreshWidget();
    } catch (error) {
      console.error('Failed to save quotes to widget:', error);
    }
  }

  /**
   * Save the daily featured quote
   */
  static async saveDailyQuote(quote: WidgetQuote): Promise<void> {
    if (Platform.OS !== 'ios') return;
    
    try {
      const quoteData = JSON.stringify({
        ...quote,
        date: new Date().toISOString()
      });
      
      await SharedGroupPreferences.setItem(
        'dailyQuote',
        quoteData,
        APP_GROUP
      );
      
      // Widget aktualisieren
      this.refreshWidget();
    } catch (error) {
      console.error('Failed to save daily quote:', error);
    }
  }

  /**
   * Save user preferences for widget display
   */
  static async saveUserPreferences(preferences: WidgetPreferences): Promise<void> {
    if (Platform.OS !== 'ios') return;
    
    try {
      await SharedGroupPreferences.setItem(
        'widgetPreferences',
        JSON.stringify(preferences),
        APP_GROUP
      );
      
      this.refreshWidget();
    } catch (error) {
      console.error('Failed to save widget preferences:', error);
    }
  }

  /**
   * Get saved quotes from widget storage
   */
  static async getSavedQuotes(): Promise<WidgetQuote[]> {
    if (Platform.OS !== 'ios') return [];
    
    try {
      const quotesData = await SharedGroupPreferences.getItem(
        'savedQuotes',
        APP_GROUP
      );
      
      if (quotesData) {
        return JSON.parse(quotesData as string);
      }
    } catch (error) {
      console.error('Failed to get saved quotes:', error);
    }
    
    return [];
  }

  /**
   * Clear all widget data
   */
  static async clearWidgetData(): Promise<void> {
    if (Platform.OS !== 'ios') return;
    
    try {
      await SharedGroupPreferences.setItem('savedQuotes', null, APP_GROUP);
      await SharedGroupPreferences.setItem('dailyQuote', null, APP_GROUP);
      await SharedGroupPreferences.setItem('widgetPreferences', null, APP_GROUP);
      
      this.refreshWidget();
    } catch (error) {
      console.error('Failed to clear widget data:', error);
    }
  }

  /**
   * Force widget to refresh its timeline
   */
  static refreshWidget(): void {
    if (Platform.OS === 'ios') {
      // Try to use WidgetKit native module if available
      // This would need to be implemented as a native module
      const WidgetKit = NativeModules.WidgetKit;
      if (WidgetKit?.reloadAllTimelines) {
        WidgetKit.reloadAllTimelines();
      }
    }
  }

  /**
   * Save favorite quotes to widget
   */
  static async saveFavoriteQuotes(quotes: WidgetQuote[]): Promise<void> {
    if (Platform.OS !== 'ios') return;
    
    try {
      // Limit to 50 quotes for widget performance
      const limitedQuotes = quotes.slice(0, 50);
      await this.saveQuotesToWidget(limitedQuotes);
    } catch (error) {
      console.error('Failed to save favorite quotes to widget:', error);
    }
  }
}