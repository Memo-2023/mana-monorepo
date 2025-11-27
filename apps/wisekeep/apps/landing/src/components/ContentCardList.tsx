import { Component, For, createSignal, onMount } from 'solid-js';
import ContentCard from './ContentCard';

interface Talk {
	id: string;
	title: string;
	speaker: string;
	speakerId?: string;
	duration: string;
	excerpt: string;
	tags: string[];
	link: string;
	date?: string;
	thumbnail?: string;
	views?: string;
}

const ContentCardList: Component = () => {
	const [talks, setTalks] = createSignal<Talk[]>([]);
	const [loading, setLoading] = createSignal(true);

	// Mock data - später durch API-Call ersetzen
	onMount(() => {
		// Simuliere API-Call
		setTimeout(() => {
			setTalks([
				{
					id: '1',
					title: 'Perspective is Everything: The Psychology of Reframing',
					speaker: 'Rory Sutherland',
					speakerId: 'rory-sutherland',
					duration: '18 Min',
					excerpt:
						'Wie kleine Änderungen in der Perspektive große Auswirkungen auf unser Verhalten und unsere Entscheidungen haben können. Ein faszinierender Einblick in die Verhaltensökonomie.',
					tags: ['Behavioral Economics', 'Psychology', 'Marketing'],
					link: '/talks/rory-sutherland-perspective-is-everything',
					date: '15. März 2024',
					views: '12.5k',
				},
				{
					id: '2',
					title: 'The Power of Psychological Solutions',
					speaker: 'Rory Sutherland',
					speakerId: 'rory-sutherland',
					duration: '22 Min',
					excerpt:
						'Warum psychologische Lösungen oft effektiver und günstiger sind als technische. Sutherland zeigt, wie wir Probleme neu denken können.',
					tags: ['Innovation', 'Problem Solving', 'Design Thinking'],
					link: '/talks/rory-sutherland-psychological-solutions',
					date: '10. März 2024',
					views: '8.3k',
				},
				{
					id: '3',
					title: 'Marketing Secrets from Behavioral Science',
					speaker: 'Rory Sutherland',
					speakerId: 'rory-sutherland',
					duration: '25 Min',
					excerpt:
						'Die verborgenen psychologischen Mechanismen hinter erfolgreichem Marketing. Erkenntnisse aus jahrzehntelanger Erfahrung bei Ogilvy.',
					tags: ['Marketing', 'Consumer Behavior', 'Branding'],
					link: '/talks/rory-sutherland-marketing-secrets',
					date: '5. März 2024',
					views: '15.7k',
				},
				{
					id: '4',
					title: 'Why Context Matters More Than Content',
					speaker: 'Rory Sutherland',
					speakerId: 'rory-sutherland',
					duration: '20 Min',
					excerpt:
						'Der Kontext bestimmt, wie wir Informationen wahrnehmen und interpretieren. Eine Lektion in der Kunst der Kommunikation.',
					tags: ['Communication', 'Perception', 'Context'],
					link: '/talks/rory-sutherland-context-matters',
					date: '1. März 2024',
					views: '6.2k',
				},
				{
					id: '5',
					title: 'The Irrational Consumer: Understanding Human Behavior',
					speaker: 'Rory Sutherland',
					speakerId: 'rory-sutherland',
					duration: '30 Min',
					excerpt:
						'Menschen sind keine rationalen Akteure. Wie wir diese Erkenntnis nutzen können, um bessere Produkte und Services zu entwickeln.',
					tags: ['Consumer Psychology', 'Behavioral Economics', 'UX Design'],
					link: '/talks/rory-sutherland-irrational-consumer',
					date: '25. Februar 2024',
					views: '10.1k',
				},
				{
					id: '6',
					title: 'Alchemy: The Magic of Ideas',
					speaker: 'Rory Sutherland',
					speakerId: 'rory-sutherland',
					duration: '28 Min',
					excerpt:
						'Große Ideen kommen oft aus unerwarteten Ecken. Sutherland erklärt, warum Logik allein nicht ausreicht, um Innovation zu schaffen.',
					tags: ['Creativity', 'Innovation', 'Ideas'],
					link: '/talks/rory-sutherland-alchemy',
					date: '20. Februar 2024',
					views: '18.9k',
				},
			]);
			setLoading(false);
		}, 500);
	});

	return (
		<div class="w-full">
			{loading() ? (
				// Loading skeleton
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					<For each={[1, 2, 3, 4, 5, 6]}>
						{() => (
							<div class="glass rounded-2xl overflow-hidden h-[460px] animate-pulse">
								<div class="h-48 bg-theme-surface"></div>
								<div class="p-6">
									<div class="h-6 bg-theme-surface rounded mb-3"></div>
									<div class="h-4 bg-theme-surface rounded w-2/3 mb-3"></div>
									<div class="space-y-2">
										<div class="h-3 bg-theme-surface rounded"></div>
										<div class="h-3 bg-theme-surface rounded"></div>
										<div class="h-3 bg-theme-surface rounded w-5/6"></div>
									</div>
								</div>
							</div>
						)}
					</For>
				</div>
			) : (
				// Content cards grid
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					<For each={talks()}>
						{(talk) => (
							<ContentCard
								title={talk.title}
								speaker={talk.speaker}
								speakerId={talk.speakerId}
								duration={talk.duration}
								excerpt={talk.excerpt}
								tags={talk.tags}
								link={talk.link}
								date={talk.date}
								thumbnail={talk.thumbnail}
								views={talk.views}
							/>
						)}
					</For>
				</div>
			)}
		</div>
	);
};

export default ContentCardList;
