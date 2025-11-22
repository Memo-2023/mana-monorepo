/**
 * Consolidated formatting utilities
 * Combines and replaces duplicate formatting functions across the app
 */

import { TIME_SEC } from './sharedConstants';

/**
 * Format duration in seconds to MM:SS or HH:MM:SS format
 * Replaces multiple duplicate formatTime functions
 */
export const formatDuration = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '--:--';
  }
  
  const hours = Math.floor(seconds / TIME_SEC.HOUR);
  const minutes = Math.floor((seconds % TIME_SEC.HOUR) / TIME_SEC.MINUTE);
  const remainingSeconds = Math.floor(seconds % TIME_SEC.MINUTE);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Format duration in seconds with units (for display)
 * e.g., "2 min 30 sec" or "1h 23m"
 */
export const formatDurationWithUnits = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return 'keine Zeit';
  }
  
  const hours = Math.floor(seconds / TIME_SEC.HOUR);
  const minutes = Math.floor((seconds % TIME_SEC.HOUR) / TIME_SEC.MINUTE);
  const remainingSeconds = Math.floor(seconds % TIME_SEC.MINUTE);
  
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  
  if (minutes > 0) {
    return remainingSeconds > 0 && minutes < 5 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  
  return `${remainingSeconds}s`;
};

/**
 * Format duration in seconds to human readable German text
 * e.g., "1 Stunde 23 Minuten"
 */
export const formatDurationHumanReadable = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return 'keine Zeit';
  }
  
  const hours = Math.floor(seconds / TIME_SEC.HOUR);
  const minutes = Math.floor((seconds % TIME_SEC.HOUR) / TIME_SEC.MINUTE);
  const remainingSeconds = Math.floor(seconds % TIME_SEC.MINUTE);
  
  const parts = [];
  
  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'Stunde' : 'Stunden'}`);
  }
  
  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? 'Minute' : 'Minuten'}`);
  }
  
  if (remainingSeconds > 0 && hours === 0) {
    parts.push(`${remainingSeconds} ${remainingSeconds === 1 ? 'Sekunde' : 'Sekunden'}`);
  }
  
  if (parts.length === 0) {
    return '0 Sekunden';
  }
  
  return parts.join(' ');
};

/**
 * Format duration from milliseconds
 */
export const formatDurationFromMs = (milliseconds: number): string => {
  return formatDuration(milliseconds / 1000);
};

/**
 * Format Date object to localized date string
 * @param date - Date to format
 * @param locale - Optional locale string (e.g., 'en-US', 'de-DE')
 * @param options - Optional Intl.DateTimeFormatOptions
 */
export const formatDate = (date: Date, locale?: string, options?: Intl.DateTimeFormatOptions): string => {
  // Default options for a nice full date format
  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  
  return date.toLocaleDateString(locale || undefined, options || defaultOptions);
};

/**
 * Format Date object to localized time string
 * @param date - Date to format
 * @param locale - Optional locale string (e.g., 'en-US', 'de-DE')
 * @param includeUhr - Whether to append "Uhr" for German locales
 */
export const formatTime = (date: Date, locale?: string, includeUhr: boolean = true): string => {
  // Determine if we should use 12-hour format based on locale
  const langCode = locale ? locale.split('-')[0] : '';
  const is12Hour = ['en', 'hi', 'ur', 'tl', 'ms'].includes(langCode);
  
  const timeString = date.toLocaleTimeString(locale || undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: is12Hour || false,
  });
  
  // Add language-specific formatting
  if (includeUhr && locale) {
    const langCode = locale.split('-')[0];
    
    // Germanic languages
    if (langCode === 'de') return `${timeString} Uhr`;
    if (langCode === 'nl') return `${timeString} uur`;
    if (langCode === 'da') return `kl. ${timeString.replace(':', '.')}`;
    if (langCode === 'sv') return `kl. ${timeString}`;
    
    // Romance languages
    if (langCode === 'fr') return timeString.replace(':', 'h');
    
    // Slavic languages
    if (langCode === 'bg') return `${timeString} ч.`;
    
    // Baltic languages
    if (langCode === 'lt') return `${timeString} val.`;
    
    // Finno-Ugric languages
    if (langCode === 'fi') return `klo ${timeString.replace(':', '.')}`;
    
    // Asian languages with suffixes
    if (langCode === 'th') return `${timeString} น.`;
    
    // Languages with dot separator
    if (langCode === 'id') return timeString.replace(':', '.');
    
    // Special handling for 12h languages that need suffixes
    if (langCode === 'ms' && is12Hour) {
      // Malay uses PG (pagi/morning) and PTG (petang/evening)
      const hour = date.getHours();
      const suffix = hour < 12 ? 'PG' : 'PTG';
      return timeString.replace(/[AP]M/i, suffix);
    }
  }
  
  return timeString;
};

/**
 * Format ISO date string to localized date
 * Replaces inline formatDate functions in components
 */
export const formatDateFromString = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return formatDate(date);
  } catch {
    return dateString;
  }
};

/**
 * Format ISO date string with time and optional duration
 * Used in memo displays
 */
export const formatDateTimeForAudio = (dateString: string, durationSeconds?: number): string => {
  try {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('de-DE');
    const formattedTime = date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
    
    let result = `${formattedDate}, ${formattedTime}`;
    
    if (durationSeconds && durationSeconds > 0) {
      result += ` • ${formatDurationWithUnits(durationSeconds)}`;
    }
    
    return result;
  } catch {
    return dateString;
  }
};

/**
 * Simple duration formatter for short durations (used in statistics)
 * Returns "X min" or "X sec" format
 */
export const formatSimpleDuration = (durationInSeconds: number): string => {
  if (durationInSeconds < 60) {
    const seconds = Math.ceil(durationInSeconds);
    return `${seconds} sec`;
  }
  const minutes = Math.ceil(durationInSeconds / 60);
  return `${minutes} min`;
};