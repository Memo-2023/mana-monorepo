/**
 * Wetter AI tools — expose weather data to the AI companion.
 * Both tools are read-only (auto policy) and run during the reasoning loop.
 */

import type { ModuleTool } from '$lib/data/tools/types';
import * as api from './api';
import { getWeatherLabel, windDirectionLabel } from './weather-icons';

export const wetterTools: ModuleTool[] = [
	{
		name: 'get_weather',
		module: 'wetter',
		description:
			'Gibt aktuelle Wetterbedingungen und 7-Tage-Vorhersage fuer einen Ort zurueck. Akzeptiert Ortsname (z.B. "Berlin") oder Koordinaten (z.B. "48.13,11.58").',
		parameters: [
			{
				name: 'location',
				type: 'string',
				description: 'Ortsname oder "lat,lon" Koordinaten',
				required: true,
			},
		],
		async execute(params) {
			const location = String(params.location ?? '').trim();
			if (!location) {
				return { success: false, message: 'location is required' };
			}

			let lat: number;
			let lon: number;
			let name: string;

			// Check if coordinates
			const coordMatch = location.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
			if (coordMatch) {
				lat = parseFloat(coordMatch[1]);
				lon = parseFloat(coordMatch[2]);
				name = `${lat}, ${lon}`;
			} else {
				// Geocode
				const results = await api.geocode(location);
				if (results.length === 0) {
					return { success: false, message: `Ort "${location}" nicht gefunden` };
				}
				lat = results[0].lat;
				lon = results[0].lon;
				name = results[0].admin1 ? `${results[0].name}, ${results[0].admin1}` : results[0].name;
			}

			const [current, forecast, alerts] = await Promise.all([
				api.getCurrentWeather(lat, lon),
				api.getForecast(lat, lon),
				api.getAlerts(lat, lon),
			]);

			const lines = [
				`# Wetter fuer ${name}`,
				'',
				`## Aktuell`,
				`${getWeatherLabel(current.weatherCode)} | ${current.temperature}°C (gefuehlt ${current.feelsLike}°C)`,
				`Wind: ${current.windSpeed} km/h ${windDirectionLabel(current.windDirection)}`,
				`Luftfeuchtigkeit: ${current.humidity}% | Druck: ${current.pressure} hPa`,
				`UV-Index: ${current.uvIndex} | Niederschlag: ${current.precipitation} mm`,
				'',
			];

			if (alerts.length > 0) {
				lines.push('## Wetterwarnungen');
				for (const a of alerts.slice(0, 5)) {
					lines.push(`- **${a.severity.toUpperCase()}**: ${a.headline} (${a.regionName})`);
				}
				lines.push('');
			}

			lines.push('## 7-Tage-Vorhersage');
			for (const d of forecast.daily.slice(0, 7)) {
				const day = new Date(d.date).toLocaleDateString('de-DE', {
					weekday: 'short',
					day: 'numeric',
					month: 'short',
				});
				lines.push(
					`- ${day}: ${getWeatherLabel(d.weatherCode)}, ${d.temperatureMin}°–${d.temperatureMax}°C, Regen: ${d.precipitationSum}mm (${d.precipitationProbabilityMax}%)`
				);
			}

			const context = lines.join('\n');
			return {
				success: true,
				message: `Wetter fuer ${name}: ${current.temperature}°C, ${getWeatherLabel(current.weatherCode)}`,
				data: { context, location: { name, lat, lon } },
			};
		},
	},
	{
		name: 'get_rain_forecast',
		module: 'wetter',
		description:
			'Gibt eine Minuten-Regenprognose (Nowcast) und aktive Wetterwarnungen fuer einen Ort zurueck. Nuetzlich um zu wissen ob es bald regnet.',
		parameters: [
			{
				name: 'location',
				type: 'string',
				description: 'Ortsname oder "lat,lon" Koordinaten',
				required: true,
			},
		],
		async execute(params) {
			const location = String(params.location ?? '').trim();
			if (!location) {
				return { success: false, message: 'location is required' };
			}

			let lat: number;
			let lon: number;
			let name: string;

			const coordMatch = location.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
			if (coordMatch) {
				lat = parseFloat(coordMatch[1]);
				lon = parseFloat(coordMatch[2]);
				name = `${lat}, ${lon}`;
			} else {
				const results = await api.geocode(location);
				if (results.length === 0) {
					return { success: false, message: `Ort "${location}" nicht gefunden` };
				}
				lat = results[0].lat;
				lon = results[0].lon;
				name = results[0].admin1 ? `${results[0].name}, ${results[0].admin1}` : results[0].name;
			}

			const [nowcast, alerts] = await Promise.all([
				api.getNowcast(lat, lon),
				api.getAlerts(lat, lon),
			]);

			const lines = [`# Regenprognose fuer ${name}`, '', `Zusammenfassung: ${nowcast.summary}`, ''];

			if (nowcast.minutely.length > 0) {
				lines.push('## Niederschlag (naechste Stunden)');
				const withRain = nowcast.minutely.filter((m) => m.precipitation > 0);
				if (withRain.length === 0) {
					lines.push('Kein Niederschlag erwartet.');
				} else {
					for (const m of withRain.slice(0, 12)) {
						const t = new Date(m.time).toLocaleTimeString('de-DE', {
							hour: '2-digit',
							minute: '2-digit',
						});
						lines.push(`- ${t}: ${m.precipitation.toFixed(1)} mm`);
					}
				}
				lines.push('');
			}

			if (alerts.length > 0) {
				lines.push('## Aktive Warnungen');
				for (const a of alerts.slice(0, 5)) {
					lines.push(`- **${a.severity.toUpperCase()}**: ${a.headline}`);
				}
			}

			return {
				success: true,
				message: nowcast.summary,
				data: { context: lines.join('\n') },
			};
		},
	},
];
