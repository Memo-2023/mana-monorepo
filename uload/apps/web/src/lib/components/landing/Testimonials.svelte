<script lang="ts">
	const testimonials = [
		{
			id: 1,
			name: 'Sarah M.',
			role: 'Content Creator',
			avatar: '👩‍🎨',
			content: 'Uload hat meine Social Media Präsenz komplett transformiert. Die Profilkarten sind genial und die Analytics helfen mir, meine Audience besser zu verstehen.',
			rating: 5,
			platform: 'Instagram'
		},
		{
			id: 2,
			name: 'Michael K.',
			role: 'Marketing Manager',
			avatar: '👨‍💼',
			content: 'Endlich ein Tool, das Link-Management und Team-Kollaboration perfekt vereint. Die API-Integration war super einfach.',
			rating: 5,
			platform: 'LinkedIn'
		},
		{
			id: 3,
			name: 'Lisa T.',
			role: 'Restaurant-Inhaberin',
			avatar: '👩‍🍳',
			content: 'Die QR-Codes für unsere Speisekarte sind ein Game-Changer. Änderungen sind sofort live, ohne neue Codes drucken zu müssen.',
			rating: 5,
			platform: 'Google'
		},
		{
			id: 4,
			name: 'Tom S.',
			role: 'Freelance Designer',
			avatar: '🎨',
			content: 'Der Card-Builder ist intuitiv und die Templates sparen mir Stunden. Meine Kunden lieben die professionellen Profilseiten.',
			rating: 5,
			platform: 'Twitter'
		},
		{
			id: 5,
			name: 'Anna B.',
			role: 'Event Managerin',
			avatar: '🎭',
			content: 'Perfekt für Events! Zeitlich begrenzte Links und Passwortschutz für VIP-Bereiche. Genau was wir gebraucht haben.',
			rating: 5,
			platform: 'Trustpilot'
		},
		{
			id: 6,
			name: 'David R.',
			role: 'Startup Founder',
			avatar: '🚀',
			content: 'Preis-Leistung ist unschlagbar. Wir haben von Bitly gewechselt und sparen 70% bei mehr Features.',
			rating: 5,
			platform: 'ProductHunt'
		}
	];

	const stats = [
		{ label: 'Beta Launch', value: '2024', icon: '🚀' },
		{ label: 'Made in', value: 'Germany', icon: '🇩🇪' },
		{ label: 'Support Response', value: '<2h', icon: '⚡' },
		{ label: 'Uptime', value: '99.9%', icon: '✅' }
	];
</script>

<section id="testimonials" class="bg-theme-surface/50 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
	<div class="mx-auto max-w-7xl">
		<div class="text-center">
			<h2 class="mb-4 text-3xl font-bold text-theme-text sm:text-4xl">
				Was Beta-Tester sagen
			</h2>
			<p class="mx-auto mb-12 max-w-2xl text-lg text-theme-text-muted">
				Erste Stimmen aus unserem exklusiven Beta-Programm
			</p>
		</div>

		<!-- Stats Grid -->
		<div class="mb-16 grid grid-cols-2 gap-4 lg:grid-cols-4">
			{#each stats as stat}
				<div class="rounded-xl border border-theme-border bg-theme-surface p-6 text-center">
					<div class="mb-2 text-3xl">{stat.icon}</div>
					<div class="text-2xl font-bold text-theme-text">{stat.value}</div>
					<div class="text-sm text-theme-text-muted">{stat.label}</div>
				</div>
			{/each}
		</div>

		<!-- Testimonials Grid -->
		<div class="grid gap-6 lg:grid-cols-3">
			{#each testimonials as testimonial}
				<div class="group rounded-xl border border-theme-border bg-theme-surface p-6 transition hover:shadow-xl">
					<div class="mb-4 flex items-start justify-between">
						<div class="flex items-center gap-3">
							<div class="flex h-12 w-12 items-center justify-center rounded-full bg-theme-primary/10 text-2xl">
								{testimonial.avatar}
							</div>
							<div>
								<p class="font-semibold text-theme-text">{testimonial.name}</p>
								<p class="text-sm text-theme-text-muted">{testimonial.role}</p>
							</div>
						</div>
						<span class="rounded bg-theme-primary/10 px-2 py-1 text-xs text-theme-primary">
							{testimonial.platform}
						</span>
					</div>
					
					<div class="mb-4 flex gap-1">
						{#each Array(testimonial.rating) as _}
							<svg class="h-4 w-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
								<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
							</svg>
						{/each}
					</div>
					
					<p class="text-theme-text-muted">
						"{testimonial.content}"
					</p>
				</div>
			{/each}
		</div>

		<!-- Use Cases -->
		<div class="mt-16 rounded-xl border border-theme-border bg-gradient-to-r from-theme-primary/5 to-purple-600/5 p-8">
			<h3 class="mb-8 text-center text-2xl font-bold text-theme-text">
				Perfekt für diese Use Cases
			</h3>
			<div class="grid gap-8 lg:grid-cols-2">
				<div class="rounded-lg bg-theme-surface p-6">
					<div class="mb-4 flex items-center gap-3">
						<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-pink-500/10">
							<span class="text-2xl">📱</span>
						</div>
						<div>
							<h4 class="font-semibold text-theme-text">Social Media Bio Links</h4>
							<p class="text-sm text-theme-text-muted">Instagram & TikTok</p>
						</div>
					</div>
					<p class="text-sm text-theme-text-muted">
						Ein Link für alle deine Kanäle. Erstelle beeindruckende Profilkarten mit unserem 
						Drag & Drop Builder und tracke jeden Klick in Echtzeit.
					</p>
				</div>

				<div class="rounded-lg bg-theme-surface p-6">
					<div class="mb-4 flex items-center gap-3">
						<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
							<span class="text-2xl">🍽️</span>
						</div>
						<div>
							<h4 class="font-semibold text-theme-text">Digitale Speisekarten</h4>
							<p class="text-sm text-theme-text-muted">Restaurants & Cafés</p>
						</div>
					</div>
					<p class="text-sm text-theme-text-muted">
						QR-Codes die sich dynamisch aktualisieren lassen. Ändere Preise und Gerichte 
						ohne neue Codes drucken zu müssen.
					</p>
				</div>

				<div class="rounded-lg bg-theme-surface p-6">
					<div class="mb-4 flex items-center gap-3">
						<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
							<span class="text-2xl">📊</span>
						</div>
						<div>
							<h4 class="font-semibold text-theme-text">Marketing Kampagnen</h4>
							<p class="text-sm text-theme-text-muted">Performance Tracking</p>
						</div>
					</div>
					<p class="text-sm text-theme-text-muted">
						Erstelle trackbare Links für jede Kampagne. Unsere Analytics zeigen dir genau, 
						welche Kanäle am besten performen.
					</p>
				</div>

				<div class="rounded-lg bg-theme-surface p-6">
					<div class="mb-4 flex items-center gap-3">
						<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
							<span class="text-2xl">🎯</span>
						</div>
						<div>
							<h4 class="font-semibold text-theme-text">Event Management</h4>
							<p class="text-sm text-theme-text-muted">Tickets & Info-Links</p>
						</div>
					</div>
					<p class="text-sm text-theme-text-muted">
						Zeitlich begrenzte Links für Events. Setze Ablaufdaten und Passwörter für 
						exklusive Inhalte und VIP-Bereiche.
					</p>
				</div>
			</div>
		</div>

		<!-- CTA -->
		<div class="mt-12 text-center">
			<p class="mb-6 text-lg text-theme-text">
				Sei einer der Ersten - starte jetzt kostenlos!
			</p>
			<a 
				href="/register" 
				class="inline-flex items-center gap-2 rounded-lg bg-theme-primary px-8 py-3 font-semibold text-white shadow-lg transition hover:bg-theme-primary-hover hover:shadow-xl"
			>
				Beta-Zugang sichern
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</a>
		</div>
	</div>
</section>