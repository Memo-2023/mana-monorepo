/**
 * @deprecated Use formatters.ts instead
 * Legacy date/time formatters - migrating to consolidated formatters
 */

import {
	formatDate as formatDateNew,
	formatTime as formatTimeNew,
	formatSimpleDuration,
} from '~/utils/formatters';
import { useTranslation } from 'react-i18next';

/**
 * @deprecated Use formatDate from ~/utils/formatters.ts
 */
export function formatDate(date: Date): string {
	return formatDateNew(date);
}

/**
 * Hook to get locale-aware date formatter
 */
export function useFormatDate() {
	const { i18n } = useTranslation();

	return (date: Date, options?: Intl.DateTimeFormatOptions) => {
		return formatDateNew(date, i18n.language, options);
	};
}

/**
 * @deprecated Use formatTime from ~/utils/formatters.ts
 */
export function formatTime(date: Date): string {
	return formatTimeNew(date);
}

/**
 * Hook to get locale-aware time formatter
 */
export function useFormatTime() {
	const { i18n } = useTranslation();

	return (date: Date, includeUhr: boolean = true) => {
		return formatTimeNew(date, i18n.language, includeUhr);
	};
}

/**
 * @deprecated Use formatSimpleDuration from ~/utils/formatters.ts
 */
export function formatDuration(durationInSeconds: number): string {
	return formatSimpleDuration(durationInSeconds);
}
