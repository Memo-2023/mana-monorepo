<!--
  SceneHeader — large title + description shown left of the first page
  in the workbench carousel. Part of the scroll track, so it slides away
  as the user moves right.

  Editing is inline: click the title or description to edit in place.
  Enter on the title commits, Escape on either reverts to the stored
  value, blur commits. No modal, no secondary UI.
-->
<script lang="ts">
	import type { WorkbenchScene } from '$lib/types/workbench-scenes';
	import { workbenchScenesStore } from '$lib/stores/workbench-scenes.svelte';

	interface Props {
		scene: WorkbenchScene | null;
	}

	const { scene }: Props = $props();

	// Helpers for the contenteditable flow. We don't bind:textContent
	// because Svelte's bindings re-render while the user is typing and
	// would fight the caret. Instead we read textContent on blur / key
	// events and commit once.

	function commitName(el: HTMLElement, current: string) {
		const next = (el.textContent ?? '').trim();
		if (!scene) return;
		if (!next) {
			// Empty name isn't allowed — revert display.
			el.textContent = current;
			return;
		}
		if (next === current) return;
		void workbenchScenesStore.renameScene(scene.id, next);
	}

	function commitDescription(el: HTMLElement, current: string) {
		const next = (el.textContent ?? '').trim();
		if (!scene) return;
		if (next === current) return;
		void workbenchScenesStore.setSceneDescription(scene.id, next || null);
	}

	function handleNameKey(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			(e.currentTarget as HTMLElement).blur();
		} else if (e.key === 'Escape') {
			e.preventDefault();
			(e.currentTarget as HTMLElement).textContent = scene?.name ?? '';
			(e.currentTarget as HTMLElement).blur();
		}
	}

	function handleDescKey(e: KeyboardEvent) {
		// Enter in the description is allowed (multi-line). Only Escape reverts.
		if (e.key === 'Escape') {
			e.preventDefault();
			(e.currentTarget as HTMLElement).textContent = scene?.description ?? '';
			(e.currentTarget as HTMLElement).blur();
		}
	}

	function handleFocus(e: FocusEvent) {
		// Select-all on focus so the first keystroke replaces content
		// rather than appending — matches the "click-to-rename" feel.
		const el = e.currentTarget as HTMLElement;
		const range = document.createRange();
		range.selectNodeContents(el);
		const sel = window.getSelection();
		sel?.removeAllRanges();
		sel?.addRange(range);
	}
</script>

{#if scene}
	<div class="scene-header">
		<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
		<h1
			class="scene-name"
			contenteditable="plaintext-only"
			spellcheck="false"
			role="textbox"
			aria-label="Szenenname"
			tabindex="0"
			onkeydown={handleNameKey}
			onfocus={handleFocus}
			onblur={(e) => commitName(e.currentTarget, scene.name)}
		>
			{scene.name}
		</h1>
		<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
		<p
			class="scene-desc"
			class:placeholder={!scene.description}
			contenteditable="plaintext-only"
			spellcheck="false"
			role="textbox"
			aria-label="Szenenbeschreibung"
			tabindex="0"
			data-placeholder="Beschreibung hinzufügen…"
			onkeydown={handleDescKey}
			onfocus={handleFocus}
			onblur={(e) => commitDescription(e.currentTarget, scene.description ?? '')}
		>
			{scene.description ?? ''}
		</p>
	</div>
{/if}

<style>
	.scene-header {
		width: 420px;
		max-width: 60vw;
		padding: 2rem 2.5rem 2rem 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		color: hsl(var(--color-foreground));
	}

	.scene-name,
	.scene-desc {
		background: transparent;
		border: none;
		outline: none;
		cursor: text;
		border-radius: 0.5rem;
		transition: background 0.15s;
	}

	.scene-name:hover,
	.scene-desc:hover,
	.scene-name:focus-visible,
	.scene-desc:focus-visible {
		background: hsl(var(--color-surface-hover, var(--color-muted)) / 0.4);
	}
	.scene-name:focus-visible,
	.scene-desc:focus-visible {
		outline: 2px solid hsl(var(--color-ring));
		outline-offset: 0.25rem;
	}

	.scene-name {
		margin: 0;
		font-size: clamp(2.75rem, 5vw, 4.5rem);
		font-weight: 700;
		line-height: 1.05;
		letter-spacing: -0.02em;
		color: hsl(var(--color-foreground));
		padding: 0.25rem 0.5rem;
		margin-left: -0.5rem;
	}

	.scene-desc {
		margin: 0;
		font-size: 1rem;
		line-height: 1.45;
		color: hsl(var(--color-muted-foreground));
		max-width: 32ch;
		padding: 0.25rem 0.5rem;
		margin-left: -0.5rem;
		min-height: 1.5rem;
	}

	/* Show the placeholder when the element is both empty AND not focused.
	   Browsers (Safari especially) treat contenteditable empty differently
	   — :empty matches only when there is no text AND no <br>, which is
	   exactly the state we want to prompt into. */
	.scene-desc.placeholder:empty::before,
	.scene-desc.placeholder:not(:focus):not(:hover)::before {
		content: attr(data-placeholder);
		opacity: 0.55;
		font-style: italic;
	}
	.scene-desc.placeholder:focus:empty::before {
		content: attr(data-placeholder);
		opacity: 0.35;
		font-style: italic;
		pointer-events: none;
	}

	@media (max-width: 639px) {
		.scene-header {
			width: 280px;
			padding: 1.25rem 1.5rem 1.25rem 0;
			gap: 0.5rem;
		}
		.scene-desc {
			font-size: 0.875rem;
		}
	}
</style>
