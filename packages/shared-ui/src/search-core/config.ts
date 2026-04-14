/**
 * Shared configuration for search/command input surfaces.
 *
 * Both QuickInputBar and GlobalSpotlight debounce their input with the same
 * 150ms window — keep them in sync so the feel of the two surfaces doesn't
 * diverge.
 */

export const SEARCH_DEBOUNCE_MS = 150;
