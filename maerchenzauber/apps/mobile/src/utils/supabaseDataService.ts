/**
 * Enhanced data service that can use Supabase for real-time features
 * while keeping the existing backend API for core functionality
 */

import { supabase, subscribeToTable, setSupabaseAuthHeader } from '../lib/supabase';
import { callStoryteller } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  return process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
};

// Set up Supabase auth header when we have a token
export const initializeSupabaseAuth = async () => {
  if (!isSupabaseConfigured()) return;
  
  try {
    const token = await AsyncStorage.getItem('appToken');
    if (token) {
      setSupabaseAuthHeader(token);
    }
  } catch (error) {
    console.error('Error initializing Supabase auth:', error);
  }
};

// Real-time subscriptions for characters
export const subscribeToCharacterChanges = (
  userId: string,
  onCharacterChange: (payload: any) => void
) => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  return subscribeToTable(
    'characters',
    (payload) => {
      onCharacterChange(payload);
    },
    { column: 'user_id', value: userId }
  );
};

// Real-time subscriptions for stories
export const subscribeToStoryChanges = (
  userId: string,
  onStoryChange: (payload: any) => void
) => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  return subscribeToTable(
    'stories',
    (payload) => {
      onStoryChange(payload);
    },
    { column: 'user_id', value: userId }
  );
};

// Enhanced character functions with caching
export const getCharactersWithCache = async () => {
  try {
    // Always use the backend API as the source of truth
    const response = await callStoryteller('/character', 'GET');
    
    // If Supabase is configured, we could cache for offline support
    if (isSupabaseConfigured()) {
      await AsyncStorage.setItem('cached_characters', JSON.stringify(response));
    }
    
    return response;
  } catch (error) {
    // If online request fails and we have Supabase, try to get cached data
    if (isSupabaseConfigured()) {
      try {
        const cached = await AsyncStorage.getItem('cached_characters');
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (cacheError) {
        console.error('Error accessing cache:', cacheError);
      }
    }
    throw error;
  }
};

// Enhanced story functions with caching
export const getStoriesWithCache = async () => {
  try {
    // Always use the backend API as the source of truth
    const response = await callStoryteller('/story', 'GET');
    
    // If Supabase is configured, we could cache for offline support
    if (isSupabaseConfigured()) {
      await AsyncStorage.setItem('cached_stories', JSON.stringify(response));
    }
    
    return response;
  } catch (error) {
    // If online request fails and we have Supabase, try to get cached data
    if (isSupabaseConfigured()) {
      try {
        const cached = await AsyncStorage.getItem('cached_stories');
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (cacheError) {
        console.error('Error accessing cache:', cacheError);
      }
    }
    throw error;
  }
};

// Direct image upload to Supabase Storage (if configured)
export const uploadImageDirect = async (
  imageUri: string,
  characterId: string,
  imageName: string
) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured for direct uploads');
  }

  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    const fileName = `characters/${characterId}/${imageName}`;
    
    const { data, error } = await supabase.storage
      .from('storyteller-images')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('storyteller-images')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Direct upload failed:', error);
    throw error;
  }
};

// Export the regular data service functions as well
export * from './dataService';