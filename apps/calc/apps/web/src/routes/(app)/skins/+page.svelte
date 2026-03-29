<script lang="ts">
	import { CALCULATOR_SKINS } from '@calc/shared/constants';
	import type { CalculatorSkin } from '@calc/shared';
	import { ModernSkin, HP35Skin, CasioSkin, TI84Skin, MinimalSkin } from '$lib/components/skins';

	let previewSkin = $state<CalculatorSkin | null>(null);

	// Demo props for preview
	const demoProps = {
		expression: '42 × 23',
		display: '966',
		error: '',
		onButton: () => {},
		onClear: () => {},
		onBackspace: () => {},
		onEquals: () => {},
	};

	function selectSkin(skin: CalculatorSkin) {
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('calc-skin', skin);
		}
		previewSkin = skin;
	}

	const skinComponents: Record<CalculatorSkin, any> = {
		modern: ModernSkin,
		hp35: HP35Skin,
		'casio-fx': CasioSkin,
		ti84: TI84Skin,
		minimal: MinimalSkin,
	};
</script>

<svelte:head>
	<title>Calc - Skins</title>
</svelte:head>

<div class="skins-page">
	<header class="mb-8">
		<h1 class="text-2xl font-bold text-foreground">Rechner-Skins</h1>
		<p class="text-muted-foreground text-sm mt-1">Wähle das Aussehen deines Taschenrechners</p>
	</header>

	<!-- Skin cards grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		{#each CALCULATOR_SKINS as skin}
			<div
				class="skin-card rounded-2xl border border-border overflow-hidden transition-all hover:border-pink-500/50 hover:shadow-lg cursor-pointer"
				class:ring-2={previewSkin === skin.id}
				class:ring-pink-500={previewSkin === skin.id}
				onclick={() => selectSkin(skin.id)}
				role="button"
				tabindex="0"
			>
				<!-- Preview -->
				<div
					class="skin-preview p-4 bg-card overflow-hidden"
					style="max-height: 320px; pointer-events: none;"
				>
					<div class="scale-[0.65] origin-top-left" style="width: 153%; height: 153%;">
						{#if skin.id === 'modern'}
							<ModernSkin {...demoProps} />
						{:else if skin.id === 'hp35'}
							<HP35Skin {...demoProps} />
						{:else if skin.id === 'casio-fx'}
							<CasioSkin {...demoProps} />
						{:else if skin.id === 'ti84'}
							<TI84Skin {...demoProps} />
						{:else if skin.id === 'minimal'}
							<MinimalSkin {...demoProps} />
						{/if}
					</div>
				</div>

				<!-- Info -->
				<div class="p-4 bg-background border-t border-border">
					<div class="flex items-center justify-between">
						<div>
							<h3 class="font-bold text-foreground">{skin.label}</h3>
							{#if skin.year}
								<span class="text-xs text-pink-500 font-medium">{skin.year}</span>
							{/if}
						</div>
						{#if previewSkin === skin.id}
							<span class="text-xs px-2 py-1 rounded-full bg-pink-500 text-white">Aktiv</span>
						{/if}
					</div>
					<p class="text-sm text-muted-foreground mt-1">{skin.description.de}</p>
				</div>
			</div>
		{/each}
	</div>

	<!-- History section -->
	<div class="mt-12">
		<h2 class="text-lg font-bold text-foreground mb-4">Geschichte des Taschenrechners</h2>
		<div class="space-y-4">
			<div class="p-4 rounded-xl bg-card border border-border">
				<div class="flex items-start gap-4">
					<span class="text-2xl shrink-0">🏛️</span>
					<div>
						<h3 class="font-bold text-foreground">HP-35 (1972)</h3>
						<p class="text-sm text-muted-foreground mt-1">
							Der HP-35 war der weltweit erste wissenschaftliche Taschenrechner. Entwickelt von
							Hewlett-Packard, machte er den Rechenschieber über Nacht obsolet. Sein Name kam daher,
							dass er 35 Tasten hatte. Preis: $395 (heute ~$2.800).
						</p>
					</div>
				</div>
			</div>

			<div class="p-4 rounded-xl bg-card border border-border">
				<div class="flex items-start gap-4">
					<span class="text-2xl shrink-0">🎒</span>
					<div>
						<h3 class="font-bold text-foreground">Casio fx-82 (1985)</h3>
						<p class="text-sm text-muted-foreground mt-1">
							Die Casio fx-Serie wurde zum Synonym für Schulrechner weltweit. Mit Solarzelle und dem
							charakteristischen grün-grauen LCD-Display war er in fast jeder Schultasche zu finden.
							Über 100 Millionen Stück verkauft.
						</p>
					</div>
				</div>
			</div>

			<div class="p-4 rounded-xl bg-card border border-border">
				<div class="flex items-start gap-4">
					<span class="text-2xl shrink-0">📊</span>
					<div>
						<h3 class="font-bold text-foreground">TI-84 Plus (2004)</h3>
						<p class="text-sm text-muted-foreground mt-1">
							Der TI-84 Plus von Texas Instruments wurde zum Standard-Grafikrechner an
							amerikanischen High Schools und Universitäten. Er konnte Funktionen plotten, Programme
							ausführen und wurde trotz Smartphones nie abgelöst.
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.skins-page {
		max-width: 900px;
		margin: 0 auto;
	}

	.skin-preview {
		background-image: radial-gradient(circle at 50% 0%, hsl(var(--muted)) 0%, transparent 70%);
	}
</style>
