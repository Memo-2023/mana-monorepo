import { Component, For, createSignal, onMount, createMemo } from 'solid-js';
import ContentCard from './ContentCard';

interface Talk {
	id: string;
	title: string;
	speaker: string;
	duration: string;
	excerpt: string;
	tags: string[];
	link: string;
	date?: string;
	thumbnail?: string;
	views?: string;
}

const SearchableContentList: Component = () => {
	const [talks, setTalks] = createSignal<Talk[]>([]);
	const [loading, setLoading] = createSignal(true);
	const [searchQuery, setSearchQuery] = createSignal('');

	// Mock data - später durch API-Call ersetzen
	onMount(() => {
		// Simuliere API-Call
		setTimeout(() => {
			setTalks([
				{
					id: '1',
					title: 'Perspective is Everything: The Psychology of Reframing',
					speaker: 'Rory Sutherland',
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
					duration: '28 Min',
					excerpt:
						'Große Ideen kommen oft aus unerwarteten Ecken. Sutherland erklärt, warum Logik allein nicht ausreicht, um Innovation zu schaffen.',
					tags: ['Creativity', 'Innovation', 'Ideas'],
					link: '/talks/rory-sutherland-alchemy',
					date: '20. Februar 2024',
					views: '18.9k',
				},
				{
					id: '7',
					title: 'How Great Leaders Inspire Action (Start with Why)',
					speaker: 'Simon Sinek',
					duration: '18 Min',
					excerpt:
						'Simon Sineks berühmter TED Talk über das Golden Circle Modell - warum großartige Führungskräfte mit dem "Warum" beginnen und wie dies das Verhalten und die Loyalität von Menschen beeinflusst.',
					tags: ['Leadership', 'Purpose', 'Golden Circle', 'Inspiration'],
					link: '/speakers/simon-sinek',
					date: '9. September 2024',
					views: '60M+',
				},
				{
					id: '8',
					title: 'Why Good Leaders Make You Feel Safe',
					speaker: 'Simon Sinek',
					duration: '12 Min',
					excerpt:
						'Ein kraftvoller Vortrag darüber, wie echte Führung bedeutet, Sicherheit für das Team zu schaffen, damit Menschen ihr Bestes geben können und bereit sind, füreinander einzustehen.',
					tags: ['Leadership', 'Trust', 'Safety', 'Team Building'],
					link: '/speakers/simon-sinek',
					date: '9. September 2024',
					views: '18M+',
				},
				{
					id: '9',
					title: 'Millennials in the Workplace',
					speaker: 'Simon Sinek',
					duration: '15 Min',
					excerpt:
						'Simon Sineks virales Interview über die Herausforderungen der Millennial-Generation im Arbeitsplatz - von der Auswirkung der Technologie bis hin zu veränderten Arbeitserwartungen.',
					tags: ['Millennials', 'Workplace', 'Technology', 'Generational Change'],
					link: '/speakers/simon-sinek',
					date: '9. September 2024',
					views: '100M+',
				},
				{
					id: '10',
					title: 'Love Your Work',
					speaker: 'Simon Sinek',
					duration: '42 Min',
					excerpt:
						'Ein inspirierender Talk über die Bedeutung von Leidenschaft bei der Arbeit und wie man eine Karriere aufbaut, die nicht nur erfolgreich, sondern auch erfüllend ist.',
					tags: ['Career', 'Passion', 'Purpose', 'Work-Life Balance'],
					link: '/speakers/simon-sinek',
					date: '9. September 2024',
					views: '2.8M',
				},
				{
					id: '11',
					title: 'The Future of AI and Machine Learning',
					speaker: 'Andrew Ng',
					duration: '35 Min',
					excerpt:
						'Ein tiefer Einblick in die Zukunft der künstlichen Intelligenz und wie Machine Learning unsere Welt verändern wird.',
					tags: ['AI', 'Machine Learning', 'Technology'],
					link: '/talks/andrew-ng-future-of-ai',
					date: '18. Februar 2024',
					views: '22.3k',
				},
				{
					id: '12',
					title: 'Building Resilient Systems',
					speaker: 'Martin Fowler',
					duration: '40 Min',
					excerpt:
						'Wie man Software-Systeme baut, die robust, wartbar und skalierbar sind. Best Practices aus jahrzehntelanger Erfahrung.',
					tags: ['Software Architecture', 'Engineering', 'Best Practices'],
					link: '/talks/martin-fowler-resilient-systems',
					date: '15. Februar 2024',
					views: '9.8k',
				},
				{
					id: '13',
					title: 'The Psychology of Money',
					speaker: 'Morgan Housel',
					duration: '32 Min',
					excerpt:
						'Warum kluge Menschen dumme Dinge mit Geld machen und wie unsere Psychologie unsere finanziellen Entscheidungen beeinflusst.',
					tags: ['Finance', 'Psychology', 'Behavioral Economics'],
					link: '/talks/morgan-housel-psychology-of-money',
					date: '10. Februar 2024',
					views: '25.6k',
				},
			]);
			setLoading(false);
		}, 500);
	});

	// Filtered talks based on search query
	const filteredTalks = createMemo(() => {
		const query = searchQuery().toLowerCase();
		if (!query) return talks();

		return talks().filter((talk) => {
			return (
				talk.title.toLowerCase().includes(query) ||
				talk.speaker.toLowerCase().includes(query) ||
				talk.excerpt.toLowerCase().includes(query) ||
				talk.tags.some((tag) => tag.toLowerCase().includes(query))
			);
		});
	});

	// Handle search input
	const handleSearch = (e: Event) => {
		const target = e.target as HTMLInputElement;
		setSearchQuery(target.value);
	};

	return (
		<div class="w-full">
			{/* Search Bar */}
			<div class="mb-12 max-w-2xl mx-auto">
				<div class="relative group">
					<input
						type="text"
						placeholder="Suche nach Vorträgen, Sprechern oder Themen..."
						value={searchQuery()}
						onInput={handleSearch}
						class="w-full px-6 py-4 pl-12 glass rounded-full text-theme-text placeholder-theme-text-muted/60 border border-theme-border/50 focus:border-theme-primary/50 focus:outline-none focus:ring-2 focus:ring-theme-primary/20 transition-all"
					/>
					<svg
						class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-text-muted"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						></path>
					</svg>

					{/* Clear button */}
					{searchQuery() && (
						<button
							onClick={() => setSearchQuery('')}
							class="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-theme-surface transition-colors"
							aria-label="Clear search"
						>
							<svg
								class="w-5 h-5 text-theme-text-muted"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								></path>
							</svg>
						</button>
					)}
				</div>

				{/* Search results count */}
				{searchQuery() && !loading() && (
					<div class="mt-4 text-center text-theme-text-muted">
						{filteredTalks().length === 0 ? (
							<span>Keine Ergebnisse für "{searchQuery()}"</span>
						) : (
							<span>
								{filteredTalks().length} {filteredTalks().length === 1 ? 'Ergebnis' : 'Ergebnisse'}{' '}
								für "{searchQuery()}"
							</span>
						)}
					</div>
				)}
			</div>

			{loading() ? (
				// Loading skeleton
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
				<>
					{filteredTalks().length === 0 && searchQuery() ? (
						// No results state
						<div class="text-center py-16">
							<div class="text-6xl mb-4">🔍</div>
							<h3 class="text-2xl font-semibold mb-2 text-theme-text">Keine Treffer</h3>
							<p class="text-theme-text-muted max-w-md mx-auto">
								Versuche es mit anderen Suchbegriffen oder browse durch alle verfügbaren Vorträge.
							</p>
							<button
								onClick={() => setSearchQuery('')}
								class="mt-6 px-6 py-2 bg-theme-primary text-white rounded-lg hover:bg-theme-primary-hover transition-colors"
							>
								Alle Vorträge anzeigen
							</button>
						</div>
					) : (
						// Content cards grid with fade-in animation
						<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
							<For each={filteredTalks()}>
								{(talk, index) => (
									<div
										style={{
											animation: `fadeIn 0.5s ease-out ${index() * 0.05}s both`,
										}}
									>
										<ContentCard
											title={talk.title}
											speaker={talk.speaker}
											duration={talk.duration}
											excerpt={talk.excerpt}
											tags={talk.tags}
											link={talk.link}
											date={talk.date}
											thumbnail={talk.thumbnail}
											views={talk.views}
										/>
									</div>
								)}
							</For>
						</div>
					)}
				</>
			)}

			<style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
		</div>
	);
};

export default SearchableContentList;
