// Configuration for Memoro App
// This file exports environment variables for use throughout the app

export default {
  // Supabase configuration
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://npgifbrwhftlbrbaglmi.supabase.co',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||    'sb_publishable_HlAZpB4BxXaMcfOCNx6VJA_-64NTxu4',

  // Memoro Service URL
  MEMORO_MIDDLEWARE_URL:
    process.env.EXPO_PUBLIC_MEMORO_MIDDLEWARE_URL ||
    'https://memoro-service-111768794939.europe-west3.run.app',

  // App configuration
  STORAGE_BUCKET: process.env.EXPO_PUBLIC_STORAGE_BUCKET || 'user-uploads',

  // RevenueCat
  REVENUECAT_IOS_KEY: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '',
  REVENUECAT_ANDROID_KEY: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '',

  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
  GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
  GOOGLE_ANDROID_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
};
