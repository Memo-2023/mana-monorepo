<!--
  Onboarding — Screen 2: Look.
  Theme-Mode (Hell/Dunkel/System) + Theme-Variant (8 colour schemes)
  picker. Writes directly to the reactive `theme` store on click, so
  the user sees the change live; userSettings mirrors the change to
  mana-auth via the shared-theme hook. No "Save" button needed — the
  "Weiter" CTA just advances.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { Sun, Moon, Desktop, Check, ArrowRight, ArrowLeft } from '@mana/shared-icons';
	import {
		THEME_DEFINITIONS,
		DEFAULT_THEME_VARIANTS,
		EXTENDED_THEME_VARIANTS,
		type ThemeVariant,
		type ThemeMode,
	} from '@mana/shared-theme';
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';
	import { onboardingFlow } from '$lib/stores/onboarding-flow.svelte';

	const modes: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
		{ id: 'light', label: 'Hell', icon: Sun },
		{ id: 'dark', label: 'Dunkel', icon: Moon },
		{ id: 'system', label: 'System', icon: Desktop },
	];

	// Greeting chain: the name the user just typed → the JWT's name
	// (returning user) → email local-part → a generic placeholder.
	// authStore.user.name doesn't refresh after PATCH until the next
	// token mint, which is why onboardingFlow.pendingName comes first.
	let displayName = $derived(
		onboardingFlow.pendingName ||
			authStore.user?.name ||
			(authStore.user?.email ?? '').split('@')[0] ||
			'dir'
	);

	let allVariants: ThemeVariant[] = [...DEFAULT_THEME_VARIANTS, ...EXTENDED_THEME_VARIANTS];

	/** Reflect the active mode in the preview so the tile gradient
	 *  matches what the rest of the app will render. */
	function paletteFor(variant: ThemeVariant) {
		const def = THEME_DEFINITIONS[variant];
		return theme.effectiveMode === 'dark' ? def.dark : def.light;
	}

	function gradientCss(variant: ThemeVariant): string {
		const c = paletteFor(variant);
		return `linear-gradient(135deg, hsl(${c.primary}) 0%, hsl(${c.secondary}) 100%)`;
	}

	async function handleNext() {
		await goto('/onboarding/templates');
	}

	async function handleBack() {
		await goto('/onboarding/name');
	}
</script>

<div class="screen">
	<div class="hero">
		<h1>Hi {displayName}, wähle deinen Look</h1>
		<p class="subtitle">
			Das Theme gilt sofort und für alle Module. Du kannst es jederzeit in Einstellungen wechseln.
		</p>
	</div>

	<section class="mode-section">
		<div class="section-label">Modus</div>
		<div class="mode-row" role="tablist">
			{#each modes as m (m.id)}
				{@const isActive = theme.mode === m.id}
				<button
					type="button"
					role="tab"
					aria-selected={isActive}
					class="mode-btn"
					class:active={isActive}
					onclick={() => theme.setMode(m.id)}
				>
					<m.icon size={16} weight={isActive ? 'fill' : 'regular'} />
					<span>{m.label}</span>
				</button>
			{/each}
		</div>
	</section>

	<section class="themes-section">
		<div class="section-label">Theme</div>
		<div class="themes-grid">
			{#each allVariants as variant (variant)}
				{@const def = THEME_DEFINITIONS[variant]}
				{@const isActive = theme.variant === variant}
				<button
					type="button"
					class="theme-card"
					class:active={isActive}
					style:background={gradientCss(variant)}
					onclick={() => theme.setVariant(variant)}
					aria-label={def.label}
					aria-pressed={isActive}
				>
					{#if isActive}
						<span class="active-check">
							<Check size={12} weight="bold" />
						</span>
					{/if}
					<span class="theme-label">{def.label}</span>
				</button>
			{/each}
		</div>
	</section>

	<div class="actions">
		<button type="button" class="btn-ghost" onclick={handleBack} aria-label="Zurück zum Namen">
			<ArrowLeft size={16} weight="bold" />
			<span>Zurück</span>
		</button>
		<button
			type="button"
			class="btn-primary"
			onclick={handleNext}
			aria-label="Weiter zu den Templates"
		>
			<span>Weiter</span>
			<ArrowRight size={16} weight="bold" />
		</button>
	</div>
</div>

<style>
	.screen {
		width: 100%;
		max-width: 560px;
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
	}

	.hero h1 {
		font-size: 1.75rem;
		font-weight: 700;
		margin: 0 0 0.5rem 0;
		letter-spacing: -0.02em;
	}

	.subtitle {
		font-size: 0.9375rem;
		color: hsl(var(--color-muted-foreground));
		line-height: 1.5;
		margin: 0;
	}

	.section-label {
		font-size: 0.6875rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-bottom: 0.625rem;
	}

	/* ── Mode selector ─────────────────────────────────────────── */
	.mode-row {
		display: flex;
		gap: 0.25rem;
		padding: 0.25rem;
		background: hsl(var(--color-muted) / 0.3);
		border-radius: 0.625rem;
	}

	.mode-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		padding: 0.625rem;
		border: none;
		background: transparent;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition:
			background 0.15s,
			color 0.15s,
			box-shadow 0.15s;
	}

	.mode-btn:hover {
		color: hsl(var(--color-foreground));
	}

	.mode-btn.active {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground, 0 0% 100%));
		box-shadow: 0 1px 3px hsl(0 0% 0% / 0.12);
	}

	.mode-btn.active:hover {
		color: hsl(var(--color-primary-foreground, 0 0% 100%));
	}

	/* ── Theme cards ───────────────────────────────────────────── */
	.themes-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.5rem;
	}

	@media (max-width: 540px) {
		.themes-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	.theme-card {
		position: relative;
		aspect-ratio: 4 / 3;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.75rem;
		cursor: pointer;
		overflow: hidden;
		padding: 0;
		transition:
			transform 0.18s ease,
			box-shadow 0.18s ease,
			border-color 0.15s;
	}

	.theme-card:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px hsl(0 0% 0% / 0.12);
	}

	.theme-card.active {
		border-color: hsl(var(--color-primary));
		box-shadow:
			0 0 0 2px hsl(var(--color-primary) / 0.35),
			0 4px 12px hsl(0 0% 0% / 0.12);
	}

	.theme-card::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, transparent 50%, hsl(0 0% 0% / 0.35) 100%);
		pointer-events: none;
	}

	.active-check {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: hsl(0 0% 100%);
		color: hsl(var(--color-primary));
		box-shadow: 0 1px 4px hsl(0 0% 0% / 0.2);
	}

	.theme-label {
		position: absolute;
		left: 0.625rem;
		bottom: 0.5rem;
		z-index: 1;
		font-size: 0.8125rem;
		font-weight: 700;
		color: hsl(0 0% 100%);
		text-shadow: 0 1px 3px hsl(0 0% 0% / 0.5);
		letter-spacing: -0.01em;
	}

	/* ── Actions ─────────────────────────────────────────────── */
	.actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 0.5rem;
	}

	.btn-ghost {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.625rem 1rem;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.9375rem;
		border-radius: 0.5rem;
		cursor: pointer;
		transition:
			background 0.15s ease,
			color 0.15s ease;
	}

	.btn-ghost:hover {
		background: hsl(var(--color-muted) / 0.4);
		color: hsl(var(--color-foreground));
	}

	.btn-primary {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		border: none;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground, 0 0% 100%));
		font-size: 0.9375rem;
		font-weight: 600;
		border-radius: 0.75rem;
		cursor: pointer;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}

	.btn-primary:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px hsl(var(--color-primary) / 0.35);
	}
</style>
