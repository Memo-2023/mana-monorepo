<!--
  GlobalFeedbackPill — fallback feedback affordance for routes outside
  ModuleShell (settings, profile, dashboards). Sits bottom-right, tucked
  above the bottom-stack chrome.

  Auto-detects module-context from the URL (e.g. `/todo` → `todo`,
  `/?app=notes` → `notes`); otherwise leaves moduleContext undefined.
  Hides itself on /onboarding and on /feedback + /community pages where
  the affordance would be redundant.
-->
<script lang="ts">
	import { page } from '$app/stores';
	import { Lightbulb } from '@mana/shared-icons';
	import { authStore } from '$lib/stores/auth.svelte';
	import FeedbackQuickModal from './FeedbackQuickModal.svelte';

	let open = $state(false);

	let path = $derived($page.url.pathname);
	let activeAppParam = $derived($page.url.searchParams.get('app'));

	let hidden = $derived(
		path.startsWith('/onboarding') ||
			path.startsWith('/feedback') ||
			path.startsWith('/community') ||
			!authStore.user
	);

	let moduleContext = $derived.by(() => {
		// Path-based detection: /todo, /notes, /picture, …
		const seg = path.split('/').filter(Boolean)[0];
		const fromPath = seg && !seg.startsWith('(') ? seg : null;
		// Workbench `?app=` param wins (homepage scene mode).
		return activeAppParam ?? fromPath ?? undefined;
	});

	function handleClick() {
		open = true;
	}
</script>

{#if !hidden}
	<button
		type="button"
		class="pill"
		onclick={handleClick}
		title="Idee oder Feedback?"
		aria-label="Feedback geben"
	>
		<Lightbulb size={18} weight="bold" />
		<span class="label">Idee?</span>
	</button>

	<FeedbackQuickModal {open} {moduleContext} onClose={() => (open = false)} />
{/if}

<style>
	.pill {
		position: fixed;
		right: 1rem;
		bottom: calc(var(--bottom-chrome-height, 5rem) + 1rem);
		z-index: 50;
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-card));
		color: hsl(var(--color-foreground));
		border-radius: 999px;
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
		box-shadow:
			0 6px 16px hsl(0 0% 0% / 0.12),
			0 2px 6px hsl(0 0% 0% / 0.08);
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease,
			border-color 0.15s ease;
	}

	.pill:hover {
		transform: translateY(-1px);
		border-color: hsl(var(--color-primary) / 0.5);
		box-shadow:
			0 10px 22px hsl(0 0% 0% / 0.16),
			0 3px 8px hsl(0 0% 0% / 0.1);
		color: hsl(var(--color-primary));
	}

	@media (max-width: 480px) {
		.pill .label {
			display: none;
		}
		.pill {
			padding: 0.5rem;
		}
	}
</style>
