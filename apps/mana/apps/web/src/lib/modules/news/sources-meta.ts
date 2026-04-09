/**
 * Source metadata for the News onboarding picker and per-article badges.
 *
 * MUST stay in sync with `services/news-ingester/src/sources.ts` —
 * the `slug` is the cross-reference key (user blocklists store it
 * verbatim, articles in the curated pool reference it). Adding or
 * removing a source means editing both files.
 *
 * `language` and `topic` are duplicated from the ingester so the client
 * doesn't need to fetch source metadata at runtime.
 */

import type { Topic, Language } from './types';

export interface SourceMeta {
	slug: string;
	name: string;
	topic: Topic;
	language: Language;
}

export const SOURCES_META: readonly SourceMeta[] = [
	// tech
	{ slug: 'hacker-news', name: 'Hacker News', topic: 'tech', language: 'en' },
	{ slug: 'arstechnica', name: 'Ars Technica', topic: 'tech', language: 'en' },
	{ slug: 'theverge', name: 'The Verge', topic: 'tech', language: 'en' },
	{ slug: 'heise', name: 'heise online', topic: 'tech', language: 'de' },
	// wissenschaft
	{ slug: 'quanta-magazine', name: 'Quanta Magazine', topic: 'wissenschaft', language: 'en' },
	{ slug: 'spektrum', name: 'Spektrum', topic: 'wissenschaft', language: 'de' },
	{ slug: 'nature-news', name: 'Nature News', topic: 'wissenschaft', language: 'en' },
	{ slug: 'phys-org', name: 'Phys.org', topic: 'wissenschaft', language: 'en' },
	// weltgeschehen
	{ slug: 'tagesschau', name: 'Tagesschau', topic: 'weltgeschehen', language: 'de' },
	{ slug: 'bbc-world', name: 'BBC World', topic: 'weltgeschehen', language: 'en' },
	{ slug: 'aljazeera', name: 'Al Jazeera', topic: 'weltgeschehen', language: 'en' },
	{ slug: 'dw-top', name: 'Deutsche Welle', topic: 'weltgeschehen', language: 'en' },
	// wirtschaft
	{ slug: 'handelsblatt', name: 'Handelsblatt', topic: 'wirtschaft', language: 'de' },
	{ slug: 'ft-world', name: 'Financial Times', topic: 'wirtschaft', language: 'en' },
	{ slug: 'bloomberg-markets', name: 'Bloomberg Markets', topic: 'wirtschaft', language: 'en' },
	{
		slug: 'economist-finance',
		name: 'The Economist — Finance',
		topic: 'wirtschaft',
		language: 'en',
	},
	// kultur
	{ slug: 'guardian-culture', name: 'The Guardian Culture', topic: 'kultur', language: 'en' },
	{ slug: 'guardian-books', name: 'The Guardian Books', topic: 'kultur', language: 'en' },
	{ slug: 'npr-arts', name: 'NPR Arts', topic: 'kultur', language: 'en' },
	// gesundheit
	{ slug: 'stat-news', name: 'STAT News', topic: 'gesundheit', language: 'en' },
	{ slug: 'bbc-health', name: 'BBC Health', topic: 'gesundheit', language: 'en' },
	{ slug: 'sciencedaily-health', name: 'ScienceDaily Health', topic: 'gesundheit', language: 'en' },
	// politik
	{ slug: 'spiegel-politik', name: 'Spiegel Politik', topic: 'politik', language: 'de' },
	{ slug: 'politico-eu', name: 'Politico EU', topic: 'politik', language: 'en' },
	{
		slug: 'atlantic-politics',
		name: 'The Atlantic — Politics',
		topic: 'politik',
		language: 'en',
	},
];

export const SOURCE_META_BY_SLUG: Record<string, SourceMeta> = Object.fromEntries(
	SOURCES_META.map((s) => [s.slug, s])
);

export function sourcesForTopic(topic: Topic): readonly SourceMeta[] {
	return SOURCES_META.filter((s) => s.topic === topic);
}

export const TOPIC_LABELS: Record<Topic, { de: string; en: string; emoji: string }> = {
	tech: { de: 'Tech', en: 'Tech', emoji: '💻' },
	wissenschaft: { de: 'Wissenschaft', en: 'Science', emoji: '🔬' },
	weltgeschehen: { de: 'Weltgeschehen', en: 'World', emoji: '🌍' },
	wirtschaft: { de: 'Wirtschaft', en: 'Business', emoji: '📈' },
	kultur: { de: 'Kultur', en: 'Culture', emoji: '🎭' },
	gesundheit: { de: 'Gesundheit', en: 'Health', emoji: '🩺' },
	politik: { de: 'Politik', en: 'Politics', emoji: '🏛️' },
};
