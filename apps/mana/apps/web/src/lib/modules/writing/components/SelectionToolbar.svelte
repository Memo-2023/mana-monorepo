<!--
  SelectionToolbar — the refinement surface that appears when the user
  has a non-empty selection in the version editor. Five operations:
  Shorten, Expand, Change tone, Rewrite, Translate. Tone and Translate
  expand to pickers; Rewrite expands to a freeform instruction input.

  Emits a `{ kind, params }` payload via `ontool`. The parent owns the
  generation call + preview panel so the toolbar stays dumb.
-->
<script lang="ts">
	import { TONE_PRESETS } from '../constants';

	export type SelectionToolKind =
		| 'selection-shorten'
		| 'selection-expand'
		| 'selection-tone'
		| 'selection-rewrite'
		| 'selection-translate';

	export interface SelectionToolInvocation {
		kind: SelectionToolKind;
		params?: { targetTone?: string; instruction?: string; targetLanguage?: string };
	}

	let {
		selectionText,
		disabled = false,
		ontool,
	}: {
		selectionText: string;
		disabled?: boolean;
		ontool: (invocation: SelectionToolInvocation) => void;
	} = $props();

	const selectedWordCount = $derived(selectionText.trim().split(/\s+/).filter(Boolean).length);

	type ExpandedMenu = 'none' | 'tone' | 'translate' | 'rewrite';
	let expanded = $state<ExpandedMenu>('none');
	let rewriteInstruction = $state('');

	const LANGUAGES: Array<{ code: string; label: string }> = [
		{ code: 'de', label: 'Deutsch' },
		{ code: 'en', label: 'English' },
		{ code: 'fr', label: 'Français' },
		{ code: 'es', label: 'Español' },
		{ code: 'it', label: 'Italiano' },
	];

	function simple(kind: SelectionToolKind) {
		expanded = 'none';
		ontool({ kind });
	}

	function tone(targetTone: string) {
		expanded = 'none';
		ontool({ kind: 'selection-tone', params: { targetTone } });
	}

	function translate(targetLanguage: string) {
		expanded = 'none';
		ontool({ kind: 'selection-translate', params: { targetLanguage } });
	}

	function rewrite() {
		const instruction = rewriteInstruction.trim();
		if (!instruction) return;
		expanded = 'none';
		rewriteInstruction = '';
		ontool({ kind: 'selection-rewrite', params: { instruction } });
	}
</script>

<div class="toolbar" role="toolbar" aria-label="Textauswahl-Werkzeuge">
	<span class="info">
		Auswahl: {selectedWordCount}
		{selectedWordCount === 1 ? 'Wort' : 'Wörter'}
	</span>
	<div class="actions">
		<button type="button" {disabled} onclick={() => simple('selection-shorten')}> ⇢ Kürzen </button>
		<button type="button" {disabled} onclick={() => simple('selection-expand')}>
			⇠ Erweitern
		</button>
		<button
			type="button"
			{disabled}
			class:active={expanded === 'tone'}
			onclick={() => (expanded = expanded === 'tone' ? 'none' : 'tone')}
		>
			🗣 Ton
		</button>
		<button
			type="button"
			{disabled}
			class:active={expanded === 'rewrite'}
			onclick={() => (expanded = expanded === 'rewrite' ? 'none' : 'rewrite')}
		>
			✎ Umschreiben
		</button>
		<button
			type="button"
			{disabled}
			class:active={expanded === 'translate'}
			onclick={() => (expanded = expanded === 'translate' ? 'none' : 'translate')}
		>
			🌐 Übersetzen
		</button>
	</div>

	{#if expanded === 'tone'}
		<div class="submenu">
			<span class="submenu-label">Neuer Ton:</span>
			{#each TONE_PRESETS as preset (preset.id)}
				<button type="button" class="chip" {disabled} onclick={() => tone(preset.id)}>
					{preset.de}
				</button>
			{/each}
		</div>
	{/if}

	{#if expanded === 'translate'}
		<div class="submenu">
			<span class="submenu-label">Zielsprache:</span>
			{#each LANGUAGES as lang (lang.code)}
				<button type="button" class="chip" {disabled} onclick={() => translate(lang.code)}>
					{lang.label}
				</button>
			{/each}
		</div>
	{/if}

	{#if expanded === 'rewrite'}
		<div class="submenu rewrite-row">
			<input
				type="text"
				bind:value={rewriteInstruction}
				placeholder={'Anweisung (z.B. "aktiver formulieren", "mit einem Zitat ergänzen")'}
				{disabled}
				onkeydown={(ev) => ev.key === 'Enter' && rewrite()}
			/>
			<button
				type="button"
				class="primary"
				disabled={disabled || !rewriteInstruction.trim()}
				onclick={rewrite}
			>
				Los
			</button>
		</div>
	{/if}
</div>

<style>
	.toolbar {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.55rem;
		border: 1px solid hsl(var(--color-primary) / 0.3);
		background: hsl(var(--color-primary) / 0.04);
	}
	.info {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
	}
	.actions > button {
		padding: 0.35rem 0.7rem;
		border-radius: 0.45rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-surface));
		cursor: pointer;
		font: inherit;
		font-size: 0.8rem;
		color: inherit;
	}
	.actions > button:hover:not(:disabled) {
		border-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary));
	}
	.actions > button.active {
		border-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.1);
	}
	.actions > button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.submenu {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
		align-items: center;
		padding-top: 0.3rem;
		border-top: 1px dashed hsl(var(--color-primary) / 0.3);
	}
	.submenu-label {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.chip {
		padding: 0.2rem 0.55rem;
		border-radius: 999px;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-surface));
		cursor: pointer;
		font: inherit;
		font-size: 0.75rem;
		color: inherit;
	}
	.chip:hover:not(:disabled) {
		border-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary));
	}
	.chip:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.rewrite-row {
		gap: 0.4rem;
	}
	.rewrite-row input {
		flex: 1;
		min-width: 0;
		padding: 0.4rem 0.6rem;
		border-radius: 0.4rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-surface));
		font: inherit;
		font-size: 0.85rem;
		color: inherit;
	}
	.rewrite-row input:focus {
		outline: 2px solid hsl(var(--color-primary));
		outline-offset: 1px;
		border-color: transparent;
	}
	.rewrite-row .primary {
		padding: 0.4rem 0.9rem;
		border-radius: 0.4rem;
		border: 1px solid hsl(var(--color-primary));
		background: hsl(var(--color-primary));
		color: white;
		cursor: pointer;
		font: inherit;
		font-size: 0.8rem;
		font-weight: 500;
	}
	.rewrite-row .primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
