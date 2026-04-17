/**
 * WMO Weather Interpretation Codes (WW) mapped to labels and icons.
 * Ref: https://open-meteo.com/en/docs#weathervariables
 *
 * Returns unicode weather symbols for lightweight rendering.
 */

interface WeatherInfo {
	label: string;
	labelEn: string;
	icon: string;
	iconNight?: string;
}

const WMO_CODES: Record<number, WeatherInfo> = {
	0: { label: 'Klar', labelEn: 'Clear sky', icon: '\u2600\uFE0F', iconNight: '\uD83C\uDF19' },
	1: {
		label: 'Ueberwiegend klar',
		labelEn: 'Mainly clear',
		icon: '\uD83C\uDF24\uFE0F',
		iconNight: '\uD83C\uDF19',
	},
	2: {
		label: 'Teilweise bewoelkt',
		labelEn: 'Partly cloudy',
		icon: '\u26C5',
		iconNight: '\uD83C\uDF19',
	},
	3: { label: 'Bedeckt', labelEn: 'Overcast', icon: '\u2601\uFE0F' },
	45: { label: 'Nebel', labelEn: 'Fog', icon: '\uD83C\uDF2B\uFE0F' },
	48: { label: 'Nebel mit Reif', labelEn: 'Depositing rime fog', icon: '\uD83C\uDF2B\uFE0F' },
	51: { label: 'Leichter Nieselregen', labelEn: 'Light drizzle', icon: '\uD83C\uDF26\uFE0F' },
	53: { label: 'Nieselregen', labelEn: 'Moderate drizzle', icon: '\uD83C\uDF26\uFE0F' },
	55: { label: 'Starker Nieselregen', labelEn: 'Dense drizzle', icon: '\uD83C\uDF27\uFE0F' },
	56: {
		label: 'Gefrierender Nieselregen',
		labelEn: 'Freezing light drizzle',
		icon: '\uD83C\uDF27\uFE0F',
	},
	57: {
		label: 'Starker gefrierender Nieselregen',
		labelEn: 'Freezing dense drizzle',
		icon: '\uD83C\uDF27\uFE0F',
	},
	61: { label: 'Leichter Regen', labelEn: 'Slight rain', icon: '\uD83C\uDF26\uFE0F' },
	63: { label: 'Regen', labelEn: 'Moderate rain', icon: '\uD83C\uDF27\uFE0F' },
	65: { label: 'Starker Regen', labelEn: 'Heavy rain', icon: '\uD83C\uDF27\uFE0F' },
	66: { label: 'Gefrierender Regen', labelEn: 'Freezing light rain', icon: '\uD83C\uDF27\uFE0F' },
	67: {
		label: 'Starker gefrierender Regen',
		labelEn: 'Freezing heavy rain',
		icon: '\uD83C\uDF27\uFE0F',
	},
	71: { label: 'Leichter Schneefall', labelEn: 'Slight snow fall', icon: '\uD83C\uDF28\uFE0F' },
	73: { label: 'Schneefall', labelEn: 'Moderate snow fall', icon: '\uD83C\uDF28\uFE0F' },
	75: { label: 'Starker Schneefall', labelEn: 'Heavy snow fall', icon: '\uD83C\uDF28\uFE0F' },
	77: { label: 'Schneegriesel', labelEn: 'Snow grains', icon: '\uD83C\uDF28\uFE0F' },
	80: { label: 'Leichte Regenschauer', labelEn: 'Slight rain showers', icon: '\uD83C\uDF26\uFE0F' },
	81: { label: 'Regenschauer', labelEn: 'Moderate rain showers', icon: '\uD83C\uDF27\uFE0F' },
	82: {
		label: 'Heftige Regenschauer',
		labelEn: 'Violent rain showers',
		icon: '\uD83C\uDF27\uFE0F',
	},
	85: {
		label: 'Leichte Schneeschauer',
		labelEn: 'Slight snow showers',
		icon: '\uD83C\uDF28\uFE0F',
	},
	86: { label: 'Starke Schneeschauer', labelEn: 'Heavy snow showers', icon: '\uD83C\uDF28\uFE0F' },
	95: { label: 'Gewitter', labelEn: 'Thunderstorm', icon: '\u26C8\uFE0F' },
	96: {
		label: 'Gewitter mit leichtem Hagel',
		labelEn: 'Thunderstorm with slight hail',
		icon: '\u26C8\uFE0F',
	},
	99: {
		label: 'Gewitter mit starkem Hagel',
		labelEn: 'Thunderstorm with heavy hail',
		icon: '\u26C8\uFE0F',
	},
};

const FALLBACK: WeatherInfo = { label: 'Unbekannt', labelEn: 'Unknown', icon: '\u2753' };

export function getWeatherInfo(code: number): WeatherInfo {
	return WMO_CODES[code] ?? FALLBACK;
}

export function getWeatherIcon(code: number, isDay = true): string {
	const info = getWeatherInfo(code);
	return !isDay && info.iconNight ? info.iconNight : info.icon;
}

export function getWeatherLabel(code: number): string {
	return getWeatherInfo(code).label;
}

/** Wind direction degrees to compass label */
export function windDirectionLabel(deg: number): string {
	const dirs = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'];
	const idx = Math.round(deg / 45) % 8;
	return dirs[idx];
}
