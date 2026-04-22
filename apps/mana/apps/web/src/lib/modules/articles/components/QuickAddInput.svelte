<!--
  QuickAddInput — inline URL-Eingabe, liegt in der Shell-Header.
  Auf Enter/Klick: saveFromUrl → Reader. Kein Preview, kein Dialog.
  Consent-Wall-Fälle gehen durch zum /articles/add-Formular wenn der
  Nutzer dort Preview + Warn-Karte braucht.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { LinkSimple } from '@mana/shared-icons';
	import { articlesStore } from '../stores/articles.svelte';

	let url = $state('');
	let busy = $state(false);
	let error = $state<string | null>(null);

	async function handleSubmit() {
		const trimmed = url.trim();
		if (!trimmed || busy) return;
		try {
			new URL(trimmed);
		} catch {
			error = 'Das sieht nicht nach einer gültigen URL aus.';
			return;
		}
		busy = true;
		error = null;
		try {
			const { article } = await articlesStore.saveFromUrl(trimmed);
			url = '';
			goto(`/articles/${article.id}`);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Speichern fehlgeschlagen.';
		} finally {
			busy = false;
		}
	}
</script>

<div class="quick-add-wrap">
	<div class="quick-add" role="search">
		<LinkSimple size={18} weight="regular" class="quick-add-icon" />
		<input
			type="url"
			class="quick-input"
			bind:value={url}
			placeholder="URL einfügen und Enter drücken…"
			disabled={busy}
			onkeydown={(e) => {
				if (e.key === 'Enter') handleSubmit();
			}}
		/>
		<button
			type="button"
			class="quick-submit"
			disabled={busy || !url.trim()}
			onclick={handleSubmit}
			aria-label="URL speichern"
		>
			{#if busy}Speichere…{:else}Speichern{/if}
		</button>
	</div>
	{#if error}
		<p class="quick-error" role="alert">{error}</p>
	{/if}
</div>

<style>
	.quick-add-wrap {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		flex: 1;
		min-width: 240px;
	}
	.quick-add {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.35rem 0.5rem 0.35rem 0.65rem;
		border-radius: 0.55rem;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.15));
		background: var(--color-surface, transparent);
	}
	.quick-add :global(.quick-add-icon) {
		color: var(--color-text-muted, #64748b);
		flex-shrink: 0;
	}
	.quick-add:focus-within {
		border-color: #f97316;
	}
	.quick-input {
		flex: 1;
		min-width: 0;
		border: none;
		outline: none;
		background: transparent;
		font: inherit;
		color: inherit;
		padding: 0.3rem 0;
	}
	.quick-input:disabled {
		opacity: 0.6;
	}
	.quick-submit {
		padding: 0.35rem 0.85rem;
		border-radius: 0.4rem;
		border: 1px solid #f97316;
		background: #f97316;
		color: white;
		font: inherit;
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
		flex-shrink: 0;
	}
	.quick-submit:hover:not(:disabled) {
		background: #ea580c;
		border-color: #ea580c;
	}
	.quick-submit:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.quick-error {
		margin: 0;
		padding: 0.35rem 0.65rem;
		border-radius: 0.4rem;
		background: rgba(239, 68, 68, 0.1);
		color: #ef4444;
		font-size: 0.82rem;
	}
</style>
