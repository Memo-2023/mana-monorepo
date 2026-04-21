<script lang="ts">
	/**
	 * SpaceCreateDialog — modal for creating a new Space.
	 *
	 * Renders a type picker, a name input, a slug preview, and
	 * (for brand/club/practice) an optional "UID / legal entity" field.
	 * POSTs to Better Auth's /organization/create with the proper
	 * metadata.type payload, then activates the new org and reloads
	 * the page so every live query repaints against the new scope.
	 */

	import { SPACE_TYPES, SPACE_TYPE_LABELS, SPACE_TYPE_DESCRIPTIONS } from '@mana/shared-branding';
	import type { SpaceType } from '@mana/shared-types';
	import { loadActiveSpace, authFetch } from '$lib/data/scope';

	interface Props {
		open: boolean;
		locale?: 'de' | 'en';
		onClose: () => void;
	}

	let { open = $bindable(), locale = 'de', onClose }: Props = $props();

	let type = $state<SpaceType>('brand');
	let name = $state('');
	let slug = $state('');
	let slugTouched = $state(false);
	let voiceDoc = $state('');
	let uid = $state('');
	let legalEntity = $state('');
	let submitting = $state(false);
	let error = $state<string | null>(null);

	/**
	 * Keep `slug` in sync with `name` until the user edits the slug
	 * directly. A minimal slugifier — lowercase alphanumerics + hyphens,
	 * trim dashes, cap at 32 chars. The server generates its own if we
	 * leave this blank, but showing a live preview is friendlier.
	 */
	const derivedSlug = $derived(
		slugTouched
			? slug
			: name
					.toLowerCase()
					.replace(/[^a-z0-9-]+/g, '-')
					.replace(/-+/g, '-')
					.replace(/^-|-$/g, '')
					.slice(0, 32)
	);

	function close() {
		if (submitting) return;
		open = false;
		error = null;
		onClose();
	}

	function handleKey(e: KeyboardEvent) {
		if (open && e.key === 'Escape') close();
	}

	async function submit(e: Event) {
		e.preventDefault();
		if (submitting) return;
		if (!name.trim()) {
			error = locale === 'de' ? 'Bitte einen Namen angeben' : 'Name required';
			return;
		}
		submitting = true;
		error = null;
		const metadata: Record<string, unknown> = { type };
		if (voiceDoc.trim()) metadata.voiceDoc = voiceDoc.trim();
		if (uid.trim()) metadata.uid = uid.trim();
		if (legalEntity.trim()) metadata.legalEntity = legalEntity.trim();

		try {
			const res = await authFetch('/api/auth/organization/create', {
				method: 'POST',
				body: JSON.stringify({
					name: name.trim(),
					slug: derivedSlug || undefined,
					metadata,
				}),
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `create failed: ${res.status}`);
			}
			const created = (await res.json()) as { id: string };
			// Activate the new space so the user lands inside it on reload.
			await authFetch('/api/auth/organization/set-active', {
				method: 'POST',
				body: JSON.stringify({ organizationId: created.id }),
			});
			await loadActiveSpace({ force: true });
			if (typeof window !== 'undefined') window.location.reload();
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
			submitting = false;
		}
	}

	const showBrandExtras = $derived(type === 'brand' || type === 'club');
	const showBusinessExtras = $derived(type === 'brand' || type === 'club' || type === 'practice');
</script>

<svelte:window onkeydown={handleKey} />

{#if open}
	<div
		class="backdrop"
		role="button"
		tabindex="-1"
		aria-label="Dialog schließen"
		onclick={close}
		onkeydown={(e) => (e.key === 'Enter' || e.key === ' ' ? close() : null)}
	></div>
	<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="space-create-title">
		<form onsubmit={submit}>
			<header>
				<h2 id="space-create-title">
					{locale === 'de' ? 'Neuer Space' : 'New space'}
				</h2>
				<button type="button" class="close" onclick={close} aria-label="Schließen">×</button>
			</header>

			<fieldset class="type-picker">
				<legend>{locale === 'de' ? 'Typ' : 'Type'}</legend>
				<div class="type-grid">
					{#each SPACE_TYPES as t (t)}
						{#if t !== 'personal'}
							<label class="type-option" class:active={type === t}>
								<input type="radio" name="type" value={t} bind:group={type} />
								<span class="type-name">{SPACE_TYPE_LABELS[locale][t]}</span>
								<span class="type-desc">{SPACE_TYPE_DESCRIPTIONS[locale][t]}</span>
							</label>
						{/if}
					{/each}
				</div>
			</fieldset>

			<label class="field">
				<span>{locale === 'de' ? 'Name' : 'Name'}</span>
				<input
					type="text"
					bind:value={name}
					placeholder={type === 'brand' ? 'Edisconet' : ''}
					required
				/>
			</label>

			<label class="field">
				<span>{locale === 'de' ? 'URL-Kürzel' : 'URL slug'}</span>
				<input
					type="text"
					value={derivedSlug}
					oninput={(e) => {
						slug = (e.currentTarget as HTMLInputElement).value;
						slugTouched = true;
					}}
					placeholder="my-space"
					pattern="[a-z0-9-]*"
				/>
				<small class="hint">
					{locale === 'de'
						? 'mana.how/@' + (derivedSlug || '…')
						: 'mana.how/@' + (derivedSlug || '…')}
				</small>
			</label>

			{#if showBrandExtras}
				<label class="field">
					<span>{locale === 'de' ? 'Brand-Voice (optional)' : 'Brand voice (optional)'}</span>
					<textarea
						bind:value={voiceDoc}
						rows="3"
						placeholder={locale === 'de'
							? 'Tonalität, Lieblings-Wörter, verbotene Wörter …'
							: 'Tone, preferred words, banned words …'}
					></textarea>
				</label>
			{/if}

			{#if showBusinessExtras}
				<label class="field">
					<span>{locale === 'de' ? 'UID / MwSt (optional)' : 'UID / VAT (optional)'}</span>
					<input type="text" bind:value={uid} placeholder="CHE-123.456.789" />
				</label>
				<label class="field">
					<span>{locale === 'de' ? 'Rechtsform (optional)' : 'Legal entity (optional)'}</span>
					<input type="text" bind:value={legalEntity} placeholder="GmbH / AG / Verein …" />
				</label>
			{/if}

			{#if error}
				<div class="error">{error}</div>
			{/if}

			<footer>
				<button type="button" class="secondary" onclick={close} disabled={submitting}>
					{locale === 'de' ? 'Abbrechen' : 'Cancel'}
				</button>
				<button type="submit" class="primary" disabled={submitting || !name.trim()}>
					{submitting
						? locale === 'de'
							? 'Erstelle …'
							: 'Creating …'
						: locale === 'de'
							? 'Erstellen'
							: 'Create'}
				</button>
			</footer>
		</form>
	</div>
{/if}

<style>
	/* Theme-token driven throughout — mirrors @mana/shared-ui Pill so
		 the dialog lives in the same visual language and adapts to dark
		 mode automatically. */

	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		/* Above PillNav (z=1000) and SpaceSwitcher menu (z=1501) so
			 opening the dialog cleanly covers the nav chrome. */
		z-index: 1600;
		border: 0;
	}

	:global(.dark) .backdrop {
		background: rgba(0, 0, 0, 0.65);
	}

	.dialog {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: min(540px, 92vw);
		max-height: 86vh;
		overflow-y: auto;
		background: hsl(var(--color-card));
		color: hsl(var(--color-foreground));
		border: 1px solid hsl(var(--color-border));
		border-radius: 14px;
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
		z-index: 1601;
	}

	form {
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.25rem;
	}

	h2 {
		font-size: 1.125rem;
		font-weight: 600;
		margin: 0;
		color: hsl(var(--color-foreground));
	}

	.close {
		background: transparent;
		border: 0;
		font-size: 1.5rem;
		line-height: 1;
		cursor: pointer;
		color: hsl(var(--color-muted-foreground, 0 0% 50%));
		padding: 0 0.25rem;
		border-radius: 6px;
	}

	.close:hover {
		background: hsl(var(--color-muted, 0 0% 94%));
		color: hsl(var(--color-foreground));
	}

	.type-picker {
		border: 0;
		padding: 0;
		margin: 0;
	}

	.type-picker legend {
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground, 0 0% 50%));
		margin-bottom: 0.5rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.type-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}

	/* Every type card has a visible border + background, not just the
		 active one. Previously inactive cards looked like loose text. */
	.type-option {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.75rem 0.875rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-background, var(--color-card)));
		border-radius: 10px;
		cursor: pointer;
		transition: all 120ms ease;
	}

	.type-option:hover {
		border-color: hsl(var(--color-border-strong, var(--color-foreground) / 0.3));
		background: hsl(var(--color-muted, var(--color-card)));
	}

	.type-option.active {
		border-color: var(--pill-primary-color, hsl(var(--color-primary, 230 80% 55%)));
		background: color-mix(
			in srgb,
			var(--pill-primary-color, hsl(var(--color-primary, 230 80% 55%))) 12%,
			transparent
		);
	}

	.type-option input {
		display: none;
	}

	.type-name {
		font-weight: 600;
		font-size: 0.875rem;
		color: hsl(var(--color-foreground));
	}

	.type-desc {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground, 0 0% 50%));
		line-height: 1.35;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.field > span {
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground, 0 0% 50%));
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.field input,
	.field textarea {
		padding: 0.5rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 8px;
		background: hsl(var(--color-input, var(--color-background, var(--color-card))));
		color: hsl(var(--color-foreground));
		font: inherit;
		font-size: 0.875rem;
		transition: border-color 120ms ease;
	}

	.field textarea {
		resize: vertical;
		min-height: 3.5rem;
	}

	.field input::placeholder,
	.field textarea::placeholder {
		color: hsl(var(--color-muted-foreground, 0 0% 50%) / 0.7);
	}

	.field input:focus,
	.field textarea:focus {
		outline: none;
		border-color: var(--pill-primary-color, hsl(var(--color-primary, 230 80% 55%)));
		box-shadow: 0 0 0 3px
			color-mix(
				in srgb,
				var(--pill-primary-color, hsl(var(--color-primary, 230 80% 55%))) 20%,
				transparent
			);
	}

	.hint {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground, 0 0% 55%));
	}

	.error {
		padding: 0.625rem 0.75rem;
		background: color-mix(in srgb, hsl(0 70% 55%) 12%, transparent);
		color: hsl(0 70% 55%);
		border: 1px solid color-mix(in srgb, hsl(0 70% 55%) 30%, transparent);
		border-radius: 8px;
		font-size: 0.8125rem;
	}

	:global(.dark) .error {
		color: hsl(0 80% 72%);
		background: color-mix(in srgb, hsl(0 70% 50%) 20%, transparent);
		border-color: color-mix(in srgb, hsl(0 70% 50%) 40%, transparent);
	}

	footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	footer button {
		padding: 0.5rem 1.125rem;
		border-radius: 8px;
		border: 1px solid transparent;
		font: inherit;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 120ms ease;
	}

	.primary {
		background: var(--pill-primary-color, hsl(var(--color-primary, 230 80% 55%)));
		color: hsl(var(--color-primary-foreground, 0 0% 100%));
	}

	.primary:hover:not(:disabled) {
		filter: brightness(1.05);
	}

	.primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.secondary {
		background: transparent;
		border-color: hsl(var(--color-border));
		color: hsl(var(--color-foreground));
	}

	.secondary:hover:not(:disabled) {
		background: hsl(var(--color-muted, 0 0% 94%));
	}
</style>
