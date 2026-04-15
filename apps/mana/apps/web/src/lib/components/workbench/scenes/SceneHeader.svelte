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
	import { Sparkle } from '@mana/shared-icons';
	import { goto } from '$app/navigation';

	interface Props {
		scene: WorkbenchScene | null;
	}

	const { scene }: Props = $props();

	// The seeded default scene is called "Home". Its empty-description
	// placeholder gets a welcoming line instead of the generic prompt.
	const descPlaceholder = $derived(
		scene?.name === 'Home' ? 'Willkommen Zuhause im Mana Hub' : 'Beschreibung hinzufügen…'
	);

	// We avoid inline mustache interpolation inside the contenteditable
	// elements because Prettier reformats the template and leaves
	// literal leading/trailing whitespace inside the element — which
	// contenteditable preserves as part of its edit buffer. Instead,
	// we bind element refs and set textContent via $effect whenever the
	// scene value changes and the user isn't actively editing. This
	// also lets external updates (e.g. a rename synced from another
	// device) refresh the visible text without fighting the caret.
	let nameEl = $state<HTMLHeadingElement | null>(null);
	let descEl = $state<HTMLParagraphElement | null>(null);

	$effect(() => {
		if (!nameEl || !scene) return;
		if (document.activeElement === nameEl) return;
		if (nameEl.textContent !== scene.name) nameEl.textContent = scene.name;
	});

	$effect(() => {
		if (!descEl || !scene) return;
		if (document.activeElement === descEl) return;
		const next = scene.description ?? '';
		if (descEl.textContent !== next) descEl.textContent = next;
	});

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
			bind:this={nameEl}
			class="scene-name"
			contenteditable="plaintext-only"
			spellcheck="false"
			role="textbox"
			aria-label="Szenenname"
			tabindex="0"
			onkeydown={handleNameKey}
			onfocus={handleFocus}
			onblur={(e) => commitName(e.currentTarget, scene.name)}
		></h1>
		<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
		<p
			bind:this={descEl}
			class="scene-desc"
			class:placeholder={!scene.description}
			contenteditable="plaintext-only"
			spellcheck="false"
			role="textbox"
			aria-label="Szenenbeschreibung"
			tabindex="0"
			data-placeholder={descPlaceholder}
			onkeydown={handleDescKey}
			onfocus={handleFocus}
			onblur={(e) => commitDescription(e.currentTarget, scene.description ?? '')}
		></p>

		<!--
			Template-Gallery shortcut — persistent discoverability hook
			directly on the homepage. Small chip-style, deliberately
			understated so it doesn't compete with the scene-name edit
			affordance. Appears on every scene so users who land on a
			fresh device also see the path to pre-built agents.
		-->
		<button
			type="button"
			class="template-shortcut"
			onclick={() => goto('/agents/templates')}
			title="Vorgefertigte AI-Agenten"
		>
			<Sparkle size={12} weight="fill" />
			<span>Agent-Templates</span>
		</button>
	</div>
{/if}

<style>
	.scene-header {
		width: 420px;
		max-width: 60vw;
		padding: 2rem 0.25rem 2rem 0;
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

	.template-shortcut {
		align-self: flex-start;
		margin-top: 0.75rem;
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.625rem;
		border: 1px dashed color-mix(in oklab, hsl(var(--color-primary)) 45%, transparent);
		border-radius: 999px;
		background: color-mix(in oklab, hsl(var(--color-primary)) 8%, transparent);
		color: hsl(var(--color-primary));
		cursor: pointer;
		font: inherit;
		font-size: 0.75rem;
		font-weight: 500;
		transition:
			background 0.15s,
			border-color 0.15s;
	}
	.template-shortcut:hover {
		background: color-mix(in oklab, hsl(var(--color-primary)) 14%, transparent);
		border-style: solid;
	}

	@media (max-width: 639px) {
		.scene-header {
			width: 280px;
			padding: 1.25rem 0.25rem 1.25rem 0;
			gap: 0.5rem;
		}
		.scene-desc {
			font-size: 0.875rem;
		}
	}
</style>
