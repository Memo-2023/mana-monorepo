<script lang="ts">
	import { calcSettings } from '$lib/stores/calc-settings.svelte';
	import { CALCULATOR_SKINS, CALCULATOR_MODES } from '@calc/shared/constants';
	import type { CalculatorMode, CalculatorSkin } from '@calc/shared';

	let settings = $derived(calcSettings.value);

	function updateDefaultMode(mode: CalculatorMode) {
		calcSettings.update({ defaultMode: mode });
	}

	function updateDefaultSkin(skin: CalculatorSkin) {
		calcSettings.update({ defaultSkin: skin });
		// Also update the shared localStorage key
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('calc-skin', skin);
		}
	}

	function updateDecimalPlaces(event: Event) {
		const val = parseInt((event.target as HTMLInputElement).value);
		if (val >= 1 && val <= 15) {
			calcSettings.update({ decimalPlaces: val });
		}
	}

	function updateHistorySize(event: Event) {
		const val = parseInt((event.target as HTMLInputElement).value);
		if (val >= 10 && val <= 500) {
			calcSettings.update({ historySize: val });
		}
	}

	function toggleThousandsSeparator() {
		calcSettings.update({ thousandsSeparator: !settings.thousandsSeparator });
	}

	function toggleAngleMode() {
		calcSettings.update({ angleMode: settings.angleMode === 'rad' ? 'deg' : 'rad' });
	}

	function toggleKeyboardHints() {
		calcSettings.update({ showKeyboardHints: !settings.showKeyboardHints });
	}

	function resetAll() {
		calcSettings.reset();
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('calc-skin', 'modern');
		}
	}
</script>

<svelte:head>
	<title>Calc - Einstellungen</title>
</svelte:head>

<div class="settings-page">
	<header class="mb-8">
		<h1 class="text-2xl font-bold text-foreground">Einstellungen</h1>
		<p class="text-muted-foreground text-sm mt-1">Passe Calc an deine Bedürfnisse an</p>
	</header>

	<!-- General -->
	<section class="settings-section">
		<h2 class="text-lg font-bold text-foreground mb-4">Allgemein</h2>

		<!-- Default Mode -->
		<div class="setting-row">
			<div>
				<div class="setting-label">Standard-Modus</div>
				<div class="setting-desc">Wird beim Öffnen der App gezeigt</div>
			</div>
			<select
				value={settings.defaultMode}
				onchange={(e) => updateDefaultMode((e.target as HTMLSelectElement).value as CalculatorMode)}
				class="h-9 px-3 rounded-lg bg-background border border-border text-foreground text-sm"
			>
				{#each CALCULATOR_MODES as mode}
					<option value={mode.id}>{mode.label.de}</option>
				{/each}
			</select>
		</div>

		<!-- Default Skin -->
		<div class="setting-row">
			<div>
				<div class="setting-label">Standard-Skin</div>
				<div class="setting-desc">Look des Rechners</div>
			</div>
			<select
				value={settings.defaultSkin}
				onchange={(e) => updateDefaultSkin((e.target as HTMLSelectElement).value as CalculatorSkin)}
				class="h-9 px-3 rounded-lg bg-background border border-border text-foreground text-sm"
			>
				{#each CALCULATOR_SKINS as skin}
					<option value={skin.id}>{skin.label}{skin.year ? ` (${skin.year})` : ''}</option>
				{/each}
			</select>
		</div>
	</section>

	<!-- Calculation -->
	<section class="settings-section">
		<h2 class="text-lg font-bold text-foreground mb-4">Berechnung</h2>

		<!-- Decimal Places -->
		<div class="setting-row">
			<div>
				<div class="setting-label">Dezimalstellen</div>
				<div class="setting-desc">Genauigkeit der Ergebnisse (1–15)</div>
			</div>
			<div class="flex items-center gap-2">
				<input
					type="range"
					min="1"
					max="15"
					value={settings.decimalPlaces}
					oninput={updateDecimalPlaces}
					class="w-24"
				/>
				<span class="text-sm font-mono text-foreground w-6 text-center"
					>{settings.decimalPlaces}</span
				>
			</div>
		</div>

		<!-- Thousands Separator -->
		<div class="setting-row">
			<div>
				<div class="setting-label">Tausendertrennzeichen</div>
				<div class="setting-desc">1.000.000 statt 1000000</div>
			</div>
			<button
				class="toggle-btn {settings.thousandsSeparator ? 'toggle-on' : 'toggle-off'}"
				onclick={toggleThousandsSeparator}
				role="switch"
				aria-checked={settings.thousandsSeparator}
			>
				<span class="toggle-knob"></span>
			</button>
		</div>

		<!-- Angle Mode -->
		<div class="setting-row">
			<div>
				<div class="setting-label">Winkel-Modus</div>
				<div class="setting-desc">Für sin, cos, tan im wissenschaftlichen Rechner</div>
			</div>
			<button
				class="h-9 px-4 rounded-lg border transition-all text-sm font-medium
					{settings.angleMode === 'rad'
					? 'bg-violet-500 text-white border-violet-500'
					: 'bg-amber-500 text-white border-amber-500'}"
				onclick={toggleAngleMode}
			>
				{settings.angleMode === 'rad' ? 'Radiant' : 'Grad'}
			</button>
		</div>
	</section>

	<!-- Display -->
	<section class="settings-section">
		<h2 class="text-lg font-bold text-foreground mb-4">Anzeige</h2>

		<!-- History Size -->
		<div class="setting-row">
			<div>
				<div class="setting-label">Verlauf-Größe</div>
				<div class="setting-desc">Maximale Anzahl gespeicherter Berechnungen</div>
			</div>
			<div class="flex items-center gap-2">
				<input
					type="number"
					min="10"
					max="500"
					step="10"
					value={settings.historySize}
					oninput={updateHistorySize}
					class="w-20 h-9 px-2 rounded-lg bg-background border border-border text-foreground font-mono text-sm text-center"
				/>
			</div>
		</div>

		<!-- Keyboard Hints -->
		<div class="setting-row">
			<div>
				<div class="setting-label">Tastatur-Hinweise</div>
				<div class="setting-desc">Zeige Keyboard-Shortcuts in der UI</div>
			</div>
			<button
				class="toggle-btn {settings.showKeyboardHints ? 'toggle-on' : 'toggle-off'}"
				onclick={toggleKeyboardHints}
				role="switch"
				aria-checked={settings.showKeyboardHints}
			>
				<span class="toggle-knob"></span>
			</button>
		</div>
	</section>

	<!-- Keyboard shortcuts reference -->
	<section class="settings-section">
		<h2 class="text-lg font-bold text-foreground mb-4">Tastaturkürzel</h2>
		<div class="grid grid-cols-2 gap-2">
			{#each [['0–9, .', 'Ziffern eingeben'], ['+ - * /', 'Operatoren'], ['( )', 'Klammern'], ['Enter / =', 'Berechnen'], ['Backspace', 'Letzte Stelle löschen'], ['Esc / C', 'Alles löschen'], ['Cmd+K', 'Schnellzugriff'], ['Cmd+1–9', 'Navigation']] as [key, desc]}
				<div class="flex items-center gap-3 p-2 rounded-lg bg-card border border-border">
					<kbd class="shrink-0 px-2 py-0.5 rounded bg-muted text-xs font-mono text-muted-foreground"
						>{key}</kbd
					>
					<span class="text-sm text-foreground">{desc}</span>
				</div>
			{/each}
		</div>
	</section>

	<!-- Reset -->
	<section class="settings-section">
		<button
			class="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm"
			onclick={resetAll}
		>
			Alle Einstellungen zurücksetzen
		</button>
	</section>
</div>

<style>
	.settings-page {
		max-width: 600px;
		margin: 0 auto;
	}

	.settings-section {
		margin-bottom: 2rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid hsl(var(--border));
	}

	.settings-section:last-child {
		border-bottom: none;
	}

	.setting-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem 0;
	}

	.setting-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--foreground));
	}

	.setting-desc {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		margin-top: 2px;
	}

	.toggle-btn {
		position: relative;
		width: 44px;
		height: 24px;
		border-radius: 12px;
		border: none;
		cursor: pointer;
		transition: background 0.2s;
		flex-shrink: 0;
	}

	.toggle-on {
		background: #ec4899;
	}

	.toggle-off {
		background: hsl(var(--muted));
	}

	.toggle-knob {
		position: absolute;
		top: 2px;
		width: 20px;
		height: 20px;
		border-radius: 10px;
		background: white;
		transition: left 0.2s;
	}

	.toggle-on .toggle-knob {
		left: 22px;
	}

	.toggle-off .toggle-knob {
		left: 2px;
	}
</style>
