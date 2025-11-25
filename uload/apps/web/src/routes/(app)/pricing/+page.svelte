<script lang="ts">
	import type { PageData } from './$types';
	import UpgradeButton from '$lib/components/UpgradeButton.svelte';
	import Navigation from '$lib/components/Navigation.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { page } from '$app/stores';
	import { Check, X, Star } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	// Check if user was redirected from cancelled checkout
	let wasCancelled = $derived($page.url.searchParams.get('cancelled') === 'true');

	const plans = [
		{
			name: 'Free',
			price: '0€',
			period: 'für immer',
			features: [
				'10 Links pro Monat',
				'Basis Analytics',
				'QR Codes',
				'Link Anpassung'
			],
			limitations: [
				'Limitierte Links',
				'Standard Support'
			],
			priceType: null,
			popular: false
		},
		{
			name: 'Pro Monatlich',
			price: '4,99€',
			period: 'pro Monat',
			features: [
				'300 Links pro Monat',
				'Erweiterte Analytics',
				'Custom QR Codes',
				'Link Anpassung',
				'Priority Support',
				'Keine Werbung',
				'API Zugang'
			],
			limitations: [],
			priceType: 'monthly',
			popular: false
		},
		{
			name: 'Pro Jährlich',
			price: '39,99€',
			period: 'pro Jahr',
			savings: 'Spare 20€ pro Jahr!',
			features: [
				'600 Links pro Monat',
				'Erweiterte Analytics',
				'Custom QR Codes',
				'Link Anpassung',
				'Priority Support',
				'Keine Werbung',
				'API Zugang'
			],
			limitations: [],
			priceType: 'yearly',
			popular: true
		},
		{
			name: 'Pro Lifetime',
			price: '129,99€',
			period: 'einmalig',
			savings: 'Für immer Pro!',
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
			priceType: 'lifetime',
			popular: false
		}
	];

	let openFaq = $state<number | null>(null);
</script>

<svelte:head>
	<title>Preise - ulo.ad</title>
	<meta name="description" content="Wähle den perfekten Plan für deine Bedürfnisse" />
</svelte:head>

<Navigation user={data.user} currentPath={$page.url.pathname} />

<div class="min-h-screen bg-theme-background px-4 py-12">
	<div class="mx-auto max-w-7xl">
		<!-- Header -->
		<div class="mb-12 text-center">
			<h1 class="mb-4 text-4xl font-bold text-theme-text">Wähle deinen Plan</h1>
			<p class="text-xl text-theme-text-muted">
				Starte kostenlos und upgrade wenn du mehr brauchst
			</p>

			{#if wasCancelled}
				<div
					class="mx-auto mt-6 flex max-w-md items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20"
				>
					<svg
						class="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<div>
						<p class="text-sm text-blue-800 dark:text-blue-300">
							Kein Problem! Du kannst jederzeit upgraden, wenn du bereit bist.
						</p>
					</div>
				</div>
			{/if}
		</div>

		<!-- Pricing Cards -->
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
			{#each plans as plan}
				<div
					class="relative flex flex-col rounded-xl {plan.popular
						? 'border-2 border-theme-primary shadow-xl'
						: 'border border-theme-border'} bg-white p-6 dark:bg-gray-800"
				>
					{#if plan.popular}
						<div
							class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-theme-primary px-4 py-1"
						>
							<div class="flex items-center gap-1">
								<Star class="h-4 w-4 text-white fill-white" />
								<span class="text-xs font-bold text-white">BELIEBT</span>
							</div>
						</div>
					{/if}

					<!-- Plan Header -->
					<div class="mb-6">
						<h3 class="text-xl font-bold text-theme-text">{plan.name}</h3>
						<div class="mt-2 flex items-baseline">
							<span class="text-3xl font-bold text-theme-text">{plan.price}</span>
							<span class="ml-2 text-theme-text-muted">/{plan.period}</span>
						</div>
						{#if plan.savings}
							<p class="mt-2 text-sm font-medium text-green-600 dark:text-green-400">
								{plan.savings}
							</p>
						{/if}
					</div>

					<!-- Features -->
					<ul class="mb-6 flex-1 space-y-3">
						{#each plan.features as feature}
							<li class="flex items-start gap-2">
								<Check class="h-5 w-5 flex-shrink-0 text-green-500" />
								<span class="text-sm text-theme-text">{feature}</span>
							</li>
						{/each}
						{#each plan.limitations as limitation}
							<li class="flex items-start gap-2">
								<X class="h-5 w-5 flex-shrink-0 text-red-500" />
								<span class="text-sm text-theme-text-muted">{limitation}</span>
							</li>
						{/each}
					</ul>

					<!-- CTA Button -->
					<div>
						{#if plan.priceType === null}
							<button
								disabled
								class="w-full rounded-lg bg-gray-100 px-4 py-2 text-center font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400"
							>
								Aktueller Plan
							</button>
						{:else}
							<UpgradeButton
								priceType={plan.priceType}
								className="w-full {plan.popular
									? 'bg-theme-primary hover:bg-theme-primary-hover text-white'
									: 'bg-theme-surface hover:bg-theme-surface-hover text-theme-text'}"
							/>
						{/if}
					</div>
				</div>
			{/each}
		</div>


		<!-- FAQ Section -->
		<div class="mt-16">
			<h2 class="mb-8 text-center text-2xl font-bold text-theme-text">Häufige Fragen</h2>
			<div class="mx-auto max-w-3xl space-y-4">
				<div class="rounded-lg border border-theme-border bg-white dark:bg-gray-800">
					<button
						onclick={() => (openFaq = openFaq === 1 ? null : 1)}
						class="flex w-full items-center justify-between p-4 text-left"
					>
						<span class="font-medium text-theme-text">
							Was ist der Unterschied zwischen den Pro-Plänen?
						</span>
						<svg
							class="h-5 w-5 text-theme-text-muted transition-transform {openFaq === 1
								? 'rotate-180'
								: ''}"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>
					{#if openFaq === 1}
						<div class="border-t border-theme-border px-4 pb-4">
							<p class="text-theme-text-muted">
								Alle Pro-Pläne haben die gleichen Features, unterscheiden sich aber im Preis:
								Monatlich (4,99€/Monat), Jährlich (39,99€/Jahr - spare 20€), oder Lifetime 
								(129,99€ einmalig - für immer Pro ohne weitere Zahlungen).
							</p>
						</div>
					{/if}
				</div>

				<div class="rounded-lg border border-theme-border bg-white dark:bg-gray-800">
					<button
						onclick={() => (openFaq = openFaq === 2 ? null : 2)}
						class="flex w-full items-center justify-between p-4 text-left"
					>
						<span class="font-medium text-theme-text">Kann ich jederzeit upgraden?</span>
						<svg
							class="h-5 w-5 text-theme-text-muted transition-transform {openFaq === 2
								? 'rotate-180'
								: ''}"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>
					{#if openFaq === 2}
						<div class="border-t border-theme-border px-4 pb-4">
							<p class="text-theme-text-muted">
								Ja, du kannst jederzeit von Free zu Pro upgraden. Deine Links und
								Einstellungen bleiben dabei erhalten. Du kannst auch zwischen den verschiedenen
								Pro-Plänen wechseln.
							</p>
						</div>
					{/if}
				</div>

				<div class="rounded-lg border border-theme-border bg-white dark:bg-gray-800">
					<button
						onclick={() => (openFaq = openFaq === 3 ? null : 3)}
						class="flex w-full items-center justify-between p-4 text-left"
					>
						<span class="font-medium text-theme-text">
							Lohnt sich der Lifetime-Plan?
						</span>
						<svg
							class="h-5 w-5 text-theme-text-muted transition-transform {openFaq === 3
								? 'rotate-180'
								: ''}"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>
					{#if openFaq === 3}
						<div class="border-t border-theme-border px-4 pb-4">
							<p class="text-theme-text-muted">
								Der Lifetime-Plan (129,99€) amortisiert sich bereits nach etwa 2,2 Jahren im Vergleich 
								zum monatlichen Plan. Du erhältst alle Pro-Features für immer, ohne weitere monatliche
								Gebühren und hast Zugang zu allen zukünftigen Features.
							</p>
						</div>
					{/if}
				</div>

				<div class="rounded-lg border border-theme-border bg-white dark:bg-gray-800">
					<button
						onclick={() => (openFaq = openFaq === 4 ? null : 4)}
						class="flex w-full items-center justify-between p-4 text-left"
					>
						<span class="font-medium text-theme-text">Kann ich jederzeit kündigen?</span>
						<svg
							class="h-5 w-5 text-theme-text-muted transition-transform {openFaq === 4
								? 'rotate-180'
								: ''}"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>
					{#if openFaq === 4}
						<div class="border-t border-theme-border px-4 pb-4">
							<p class="text-theme-text-muted">
								Ja, du kannst dein Abo jederzeit in den Einstellungen kündigen. Du behältst
								den Zugang bis zum Ende des aktuellen Abrechnungszeitraums. Danach wechselst
								du automatisch zum Free Plan.
							</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<Footer />