<script lang="ts">
	import { goto } from '$app/navigation';
	import { useAllSites } from './queries';
	import { sitesStore, InvalidSlugError, DuplicateSlugError } from './stores/sites.svelte';
	import { isValidSlug } from './constants';

	const sites = useAllSites();

	let showCreate = $state(false);
	let draftName = $state('');
	let draftSlug = $state('');
	let creating = $state(false);
	let createError = $state<string | null>(null);

	function openCreate() {
		draftName = '';
		draftSlug = '';
		createError = null;
		showCreate = true;
	}

	function closeCreate() {
		showCreate = false;
	}

	/** Suggest a slug from the name — lowercase, hyphens for spaces. */
	function slugify(value: string): string {
		return value
			.toLowerCase()
			.normalize('NFKD')
			.replace(/[̀-ͯ]/g, '')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 40);
	}

	function onNameInput(value: string) {
		draftName = value;
		// Auto-fill slug from name if user hasn't customized the slug yet.
		if (!draftSlug || draftSlug === slugify(draftName.slice(0, draftName.length - 1))) {
			draftSlug = slugify(value);
		}
	}

	async function submit() {
		if (!draftName.trim()) {
			createError = 'Bitte gib einen Namen ein.';
			return;
		}
		if (!isValidSlug(draftSlug)) {
			createError = 'Slug ist ungültig oder reserviert.';
			return;
		}
		creating = true;
		createError = null;
		try {
			const { site, homePageId } = await sitesStore.createSite({
				slug: draftSlug,
				name: draftName.trim(),
			});
			showCreate = false;
			await goto(`/website/${site.id}/edit/${homePageId}`);
		} catch (err) {
			if (err instanceof InvalidSlugError) createError = err.message;
			else if (err instanceof DuplicateSlugError) createError = err.message;
			else createError = err instanceof Error ? err.message : String(err);
		} finally {
			creating = false;
		}
	}

	function formatRelative(iso: string): string {
		const now = Date.now();
		const then = new Date(iso).getTime();
		const diffMin = Math.floor((now - then) / 60_000);
		if (diffMin < 1) return 'gerade eben';
		if (diffMin < 60) return `vor ${diffMin} Min`;
		const diffH = Math.floor(diffMin / 60);
		if (diffH < 24) return `vor ${diffH} Std`;
		const diffD = Math.floor(diffH / 24);
		if (diffD < 30) return `vor ${diffD} Tg`;
		return new Date(iso).toLocaleDateString('de-DE');
	}
</script>

<div class="wb-list">
	<header class="wb-list__header">
		<div>
			<h2>Deine Websites</h2>
			<p class="wb-list__hint">
				Block-Editor, veröffentlichen unter <code>mana.how</code>. M1 — Publish kommt in M2.
			</p>
		</div>
		<button class="wb-list__new" onclick={openCreate}>+ Neue Website</button>
	</header>

	{#if sites.value.length === 0}
		<div class="wb-list__empty">
			<p>Noch keine Website. Leg mit einer leeren Seite los.</p>
			<button class="wb-list__new" onclick={openCreate}>+ Neue Website</button>
		</div>
	{:else}
		<div class="wb-list__grid">
			{#each sites.value as site (site.id)}
				<a class="wb-card" href="/website/{site.id}">
					<div class="wb-card__body">
						<h3>{site.name}</h3>
						<p class="wb-card__slug">/s/{site.slug}</p>
					</div>
					<div class="wb-card__meta">
						<span
							class="wb-pill"
							class:wb-pill--green={site.publishedVersion}
							class:wb-pill--amber={!site.publishedVersion}
						>
							{site.publishedVersion ? 'Veröffentlicht' : 'Entwurf'}
						</span>
						<span class="wb-card__time">{formatRelative(site.updatedAt)}</span>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

{#if showCreate}
	<div
		class="wb-modal__backdrop"
		onclick={closeCreate}
		onkeydown={(e) => e.key === 'Escape' && closeCreate()}
		role="button"
		tabindex="-1"
	></div>
	<div class="wb-modal" role="dialog" aria-modal="true" aria-labelledby="wb-create-title">
		<h3 id="wb-create-title">Neue Website</h3>

		<label class="wb-field">
			<span>Name</span>
			<!-- svelte-ignore a11y_autofocus — modal field; no navigation context to interfere -->
			<input
				type="text"
				value={draftName}
				oninput={(e) => onNameInput(e.currentTarget.value)}
				placeholder="Meine Website"
				autofocus
			/>
		</label>

		<label class="wb-field">
			<span>Slug (URL)</span>
			<div class="wb-slug-input">
				<span class="wb-slug-prefix">/s/</span>
				<input
					type="text"
					value={draftSlug}
					oninput={(e) => (draftSlug = e.currentTarget.value.toLowerCase())}
					placeholder="meine-website"
				/>
			</div>
			<small class="wb-field__hint"
				>2–40 Kleinbuchstaben/Zahlen/Bindestrich. Reservierte Slugs wie "api", "app" sind gesperrt.</small
			>
		</label>

		{#if createError}
			<p class="wb-error">{createError}</p>
		{/if}

		<div class="wb-modal__actions">
			<button class="wb-btn wb-btn--ghost" onclick={closeCreate} disabled={creating}>
				Abbrechen
			</button>
			<button class="wb-btn wb-btn--primary" onclick={submit} disabled={creating}>
				{creating ? 'Wird erstellt…' : 'Anlegen'}
			</button>
		</div>
	</div>
{/if}

<style>
	.wb-list {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.wb-list__header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}
	.wb-list__header h2 {
		margin: 0;
		font-size: 1.25rem;
	}
	.wb-list__hint {
		margin: 0.25rem 0 0;
		font-size: 0.875rem;
		opacity: 0.6;
	}
	.wb-list__hint code {
		background: rgba(255, 255, 255, 0.06);
		padding: 0.1rem 0.3rem;
		border-radius: 0.25rem;
	}
	.wb-list__new {
		padding: 0.5rem 1rem;
		border-radius: 9999px;
		background: rgba(99, 102, 241, 0.9);
		color: white;
		border: none;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
	}
	.wb-list__empty {
		padding: 3rem 1.5rem;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		border: 1px dashed rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
	}
	.wb-list__empty p {
		margin: 0;
		opacity: 0.7;
	}
	.wb-list__grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
		gap: 1rem;
	}
	.wb-card {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 0.75rem;
		text-decoration: none;
		color: inherit;
		min-height: 8rem;
		transition:
			background 0.15s ease,
			border-color 0.15s ease;
	}
	.wb-card:hover {
		background: rgba(255, 255, 255, 0.07);
		border-color: rgba(99, 102, 241, 0.4);
	}
	.wb-card h3 {
		margin: 0;
		font-size: 1rem;
	}
	.wb-card__slug {
		margin: 0.25rem 0 0;
		font-size: 0.8125rem;
		opacity: 0.55;
		font-family: ui-monospace, monospace;
	}
	.wb-card__meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: auto;
	}
	.wb-card__time {
		font-size: 0.75rem;
		opacity: 0.5;
	}
	.wb-pill {
		font-size: 0.7rem;
		padding: 0.15rem 0.5rem;
		border-radius: 9999px;
		font-weight: 500;
	}
	.wb-pill--green {
		background: rgba(16, 185, 129, 0.18);
		color: rgb(110, 231, 183);
	}
	.wb-pill--amber {
		background: rgba(245, 158, 11, 0.18);
		color: rgb(252, 211, 77);
	}

	/* Modal */
	.wb-modal__backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(2px);
		z-index: 40;
		border: none;
	}
	.wb-modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: min(90vw, 28rem);
		padding: 1.5rem;
		background: rgb(15, 18, 24);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
		z-index: 50;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.wb-modal h3 {
		margin: 0;
		font-size: 1.125rem;
	}
	.wb-field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.wb-field > span {
		font-size: 0.75rem;
		font-weight: 500;
		opacity: 0.7;
	}
	.wb-field input {
		width: 100%;
		padding: 0.5rem 0.625rem;
		border-radius: 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.04);
		color: inherit;
		font-family: inherit;
		font-size: 0.875rem;
	}
	.wb-field__hint {
		font-size: 0.75rem;
		opacity: 0.5;
	}
	.wb-slug-input {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0 0.5rem;
		border-radius: 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.04);
	}
	.wb-slug-prefix {
		font-size: 0.875rem;
		opacity: 0.6;
		font-family: ui-monospace, monospace;
	}
	.wb-slug-input input {
		border: none;
		background: transparent;
		padding-left: 0;
	}
	.wb-error {
		margin: 0;
		font-size: 0.8125rem;
		color: rgb(248, 113, 113);
	}
	.wb-modal__actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}
	.wb-btn {
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		border: none;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
	}
	.wb-btn--ghost {
		background: transparent;
		color: inherit;
		border: 1px solid rgba(255, 255, 255, 0.12);
	}
	.wb-btn--primary {
		background: rgba(99, 102, 241, 0.9);
		color: white;
	}
	.wb-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
