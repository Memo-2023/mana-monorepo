<!--
  Lasts — Settings View

  Three opt-in toggles + banner-cap slider + a "Test-Banner zeigen"-button
  that briefly forces the banner to render (useful before any real
  anniversary fires). Persists via lasts/stores/settings.svelte.ts
  (localStorage-backed).
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { lastsSettings } from '../stores/settings.svelte';

	let testBannerOpen = $state(false);

	onMount(() => {
		lastsSettings.initialize();
	});

	function toggleAnniversary() {
		lastsSettings.set('anniversaryReminders', !lastsSettings.anniversaryReminders);
	}
	function toggleRecognition() {
		lastsSettings.set('recognitionReminders', !lastsSettings.recognitionReminders);
	}
	function toggleInbox() {
		lastsSettings.set('inboxNotify', !lastsSettings.inboxNotify);
	}
	function setMaxItems(e: Event) {
		const v = Number((e.target as HTMLInputElement).value);
		if (Number.isInteger(v) && v >= 1 && v <= 10) {
			lastsSettings.set('bannerMaxItems', v);
		}
	}

	function showTestBanner() {
		testBannerOpen = true;
		setTimeout(() => (testBannerOpen = false), 4000);
	}

	function resetAll() {
		lastsSettings.reset();
	}
</script>

<section class="settings">
	<header class="head">
		<h1 class="title">{$_('lasts.settings.title')}</h1>
		<p class="tagline">{$_('lasts.settings.tagline')}</p>
	</header>

	<ul class="toggles">
		<li class="toggle">
			<label>
				<input
					type="checkbox"
					checked={lastsSettings.anniversaryReminders}
					onchange={toggleAnniversary}
				/>
				<span class="toggle-text">
					<span class="toggle-label">{$_('lasts.settings.anniversaryLabel')}</span>
					<span class="toggle-desc">{$_('lasts.settings.anniversaryDesc')}</span>
				</span>
			</label>
		</li>
		<li class="toggle">
			<label>
				<input
					type="checkbox"
					checked={lastsSettings.recognitionReminders}
					onchange={toggleRecognition}
				/>
				<span class="toggle-text">
					<span class="toggle-label">{$_('lasts.settings.recognitionLabel')}</span>
					<span class="toggle-desc">{$_('lasts.settings.recognitionDesc')}</span>
				</span>
			</label>
		</li>
		<li class="toggle">
			<label>
				<input type="checkbox" checked={lastsSettings.inboxNotify} onchange={toggleInbox} />
				<span class="toggle-text">
					<span class="toggle-label">{$_('lasts.settings.inboxLabel')}</span>
					<span class="toggle-desc">{$_('lasts.settings.inboxDesc')}</span>
				</span>
			</label>
		</li>
	</ul>

	<div class="slider-row">
		<label class="slider-label" for="banner-cap">
			{$_('lasts.settings.bannerCapLabel', { values: { count: lastsSettings.bannerMaxItems } })}
		</label>
		<input
			id="banner-cap"
			class="slider"
			type="range"
			min="1"
			max="10"
			step="1"
			value={lastsSettings.bannerMaxItems}
			oninput={setMaxItems}
		/>
	</div>

	<div class="actions">
		<button class="btn ghost" onclick={resetAll}>{$_('lasts.settings.reset')}</button>
		<button class="btn primary" onclick={showTestBanner}>
			{$_('lasts.settings.showTestBanner')}
		</button>
	</div>

	{#if testBannerOpen}
		<div class="test-banner">
			<span class="dot"></span>
			<span>
				<strong>{$_('lasts.banner.title')}</strong>
				—
				{$_('lasts.banner.anniversary', { values: { years: 3 } })}
				<em>{$_('lasts.settings.testSampleTitle')}</em>
			</span>
		</div>
	{/if}

	<p class="note">{$_('lasts.settings.pushNote')}</p>
</section>

<style>
	.settings {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		max-width: 640px;
		margin: 0 auto;
	}
	.head {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}
	.title {
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin: 0;
	}
	.tagline {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0;
	}

	.toggles {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.toggle {
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		padding: 0.625rem 0.75rem;
	}
	.toggle label {
		display: flex;
		align-items: flex-start;
		gap: 0.625rem;
		cursor: pointer;
	}
	.toggle input[type='checkbox'] {
		margin-top: 0.125rem;
		flex-shrink: 0;
	}
	.toggle-text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}
	.toggle-label {
		font-size: 0.8125rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}
	.toggle-desc {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}

	.slider-row {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 0.5rem 0;
	}
	.slider-label {
		font-size: 0.75rem;
		color: hsl(var(--color-foreground));
	}
	.slider {
		width: 100%;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}
	.btn {
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		color: hsl(var(--color-foreground));
		transition: all 0.15s;
	}
	.btn:hover {
		background: hsl(var(--color-surface-hover));
	}
	.btn.primary {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		border-color: hsl(var(--color-primary));
	}
	.btn.primary:hover {
		filter: brightness(0.92);
	}
	.btn.ghost {
		color: hsl(var(--color-muted-foreground));
		border-color: transparent;
	}
	.btn.ghost:hover {
		color: hsl(var(--color-foreground));
	}

	.test-banner {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 0.75rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-primary) / 0.08);
		border: 1px solid hsl(var(--color-primary) / 0.3);
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
	}
	.test-banner .dot {
		width: 6px;
		height: 6px;
		border-radius: 9999px;
		background: hsl(var(--color-primary));
	}

	.note {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		font-style: italic;
		margin: 0;
		padding-top: 0.5rem;
		border-top: 1px solid hsl(var(--color-border));
	}
</style>
