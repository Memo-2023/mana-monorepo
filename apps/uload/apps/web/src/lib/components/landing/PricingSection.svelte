<script lang="ts">
	let billingCycle = $state<'monthly' | 'yearly'>('monthly');
	let hoveredPlan = $state<string | null>(null);
	
	const plans = [
		{
			id: 'free',
			name: 'Free',
			price: { monthly: 0, yearly: 0 },
			description: 'Perfekt zum Ausprobieren',
			features: [
				'10 Links pro Monat',
				'Basis Analytics',
				'QR-Code Generator',
				'Link Anpassung',
				'Standard Support'
			],
			limitations: [
				'Limitierte Links',
				'Keine API',
				'Standard Support'
			],
			cta: 'Kostenlos starten',
			highlighted: false,
			color: 'gray'
		},
		{
			id: 'pro-monthly',
			name: 'Pro Monatlich',
			price: { monthly: 4.99, yearly: 4.99 },
			description: 'Für Freelancer & Creators',
			features: [
				'Unbegrenzte Links',
				'Erweiterte Analytics',
				'Custom QR Codes',
				'Link Anpassung',
				'Priority Support',
				'Keine Werbung',
				'API Zugang'
			],
			limitations: [],
			cta: 'Pro wählen',
			highlighted: false,
			color: 'theme-primary'
		},
		{
			id: 'pro-yearly',
			name: 'Pro Jährlich',
			price: { monthly: 3.33, yearly: 39.99 },
			description: 'Beste Wahl für Power User',
			features: [
				'Unbegrenzte Links',
				'Erweiterte Analytics',
				'Custom QR Codes',
				'Link Anpassung',
				'Priority Support',
				'Keine Werbung',
				'API Zugang'
			],
			limitations: [],
			cta: 'Jährlich sparen',
			highlighted: true,
			color: 'purple',
			badge: 'Spare 20€/Jahr'
		},
		{
			id: 'lifetime',
			name: 'Pro Lifetime',
			price: { monthly: 129.99, yearly: 129.99 },
			description: 'Einmalig zahlen, für immer nutzen',
			features: [
				'Alle Pro Features',
				'Lebenslanger Zugang',
				'Unbegrenzte Links',
				'Alle zukünftigen Features',
				'Priority Support',
				'Early Access zu neuen Features',
				'API Zugang'
			],
			limitations: [],
			cta: 'Lifetime sichern',
			highlighted: false,
			color: 'indigo',
			badge: 'Einmalig'
		}
	];
	
	function formatPrice(price: number): string {
		return new Intl.NumberFormat('de-DE', {
			style: 'currency',
			currency: 'EUR',
			minimumFractionDigits: price % 1 === 0 ? 0 : 2
		}).format(price);
	}
	
	function getYearlySavings(monthly: number, yearly: number): number {
		return Math.round(((monthly * 12 - yearly) / (monthly * 12)) * 100);
	}
</script>

<section id="pricing" class="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
	<div class="mx-auto max-w-7xl">
		<div class="text-center">
			<h2 class="mb-4 text-3xl font-bold text-theme-text sm:text-4xl">
				Transparente Preise, keine versteckten Kosten
			</h2>
			<p class="mx-auto mb-8 max-w-2xl text-lg text-theme-text-muted">
				Starte kostenlos und upgrade wenn du bereit bist. Jederzeit kündbar.
			</p>
			
			<!-- Billing Toggle -->
			<div class="mb-12 inline-flex items-center rounded-lg bg-theme-surface p-1">
				<button
					onclick={() => billingCycle = 'monthly'}
					class="rounded-md px-6 py-2 text-sm font-medium transition {billingCycle === 'monthly' 
						? 'bg-theme-primary text-white' 
						: 'text-theme-text hover:text-theme-text/80'}"
				>
					Monatlich
				</button>
				<button
					onclick={() => billingCycle = 'yearly'}
					class="relative rounded-md px-6 py-2 text-sm font-medium transition {billingCycle === 'yearly' 
						? 'bg-theme-primary text-white' 
						: 'text-theme-text hover:text-theme-text/80'}"
				>
					Jährlich
					<span class="absolute -right-12 -top-2 rounded bg-green-500 px-2 py-0.5 text-xs text-white">
						-17%
					</span>
				</button>
			</div>
		</div>

		<!-- Pricing Cards -->
		<div class="grid gap-8 lg:grid-cols-4">
			{#each plans as plan}
				<div 
					class="relative rounded-xl border-2 transition-all duration-300 {plan.highlighted 
						? 'border-theme-primary shadow-2xl scale-105' 
						: 'border-theme-border hover:border-theme-primary/50 hover:shadow-xl'} bg-theme-surface"
					onmouseenter={() => hoveredPlan = plan.id}
					onmouseleave={() => hoveredPlan = null}
				>
					{#if plan.badge}
						<div class="absolute -top-4 left-1/2 -translate-x-1/2">
							<span class="rounded-full bg-theme-primary px-4 py-1 text-xs font-semibold text-white">
								{plan.badge}
							</span>
						</div>
					{/if}
					
					<div class="p-6">
						<h3 class="mb-2 text-xl font-bold text-theme-text">{plan.name}</h3>
						<p class="mb-4 text-sm text-theme-text-muted">{plan.description}</p>
						
						<div class="mb-6">
							<div class="flex items-baseline">
								<span class="text-4xl font-bold text-theme-text">
									{formatPrice(billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly / 12)}
								</span>
								<span class="ml-2 text-theme-text-muted">/Monat</span>
							</div>
							{#if billingCycle === 'yearly' && plan.price.yearly > 0}
								<p class="mt-1 text-sm text-green-600 dark:text-green-400">
									Spare {getYearlySavings(plan.price.monthly, plan.price.yearly)}% jährlich
								</p>
							{/if}
						</div>
						
						<button 
							class="mb-6 w-full rounded-lg py-3 font-semibold transition {plan.highlighted 
								? 'bg-theme-primary text-white hover:bg-theme-primary-hover' 
								: 'bg-theme-surface border-2 border-theme-border text-theme-text hover:border-theme-primary hover:bg-theme-primary/5'}"
						>
							{plan.cta}
						</button>
						
						<div class="space-y-3">
							<p class="text-xs font-semibold uppercase tracking-wide text-theme-text-muted">
								Inklusive:
							</p>
							{#each plan.features as feature}
								<div class="flex items-start gap-3">
									<svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
									</svg>
									<span class="text-sm text-theme-text">{feature}</span>
								</div>
							{/each}
							
							{#if plan.limitations.length > 0}
								<div class="mt-4 border-t border-theme-border pt-4">
									{#each plan.limitations as limitation}
										<div class="flex items-start gap-3">
											<svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
											</svg>
											<span class="text-sm text-theme-text-muted">{limitation}</span>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- FAQ or Additional Info -->
		<div class="mt-16 rounded-xl border border-theme-border bg-theme-surface p-8">
			<div class="grid gap-8 lg:grid-cols-3">
				<div>
					<h4 class="mb-2 font-semibold text-theme-text">💳 Keine Kreditkarte erforderlich</h4>
					<p class="text-sm text-theme-text-muted">
						Starte komplett kostenlos. Upgrade nur wenn du mehr brauchst.
					</p>
				</div>
				<div>
					<h4 class="mb-2 font-semibold text-theme-text">🔄 Jederzeit kündbar</h4>
					<p class="text-sm text-theme-text-muted">
						Keine Vertragsbindung. Kündige monatlich ohne Probleme.
					</p>
				</div>
				<div>
					<h4 class="mb-2 font-semibold text-theme-text">🚀 Sofort startklar</h4>
					<p class="text-sm text-theme-text-muted">
						Nach der Anmeldung kannst du sofort alle Features nutzen.
					</p>
				</div>
			</div>
		</div>

		<!-- Enterprise CTA -->
		<div class="mt-12 text-center">
			<p class="mb-4 text-theme-text">
				Benötigst du eine maßgeschneiderte Lösung für dein Unternehmen?
			</p>
			<a 
				href="/contact" 
				class="inline-flex items-center gap-2 text-theme-primary hover:underline"
			>
				Kontaktiere uns für Enterprise-Lösungen
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</a>
		</div>
	</div>
</section>