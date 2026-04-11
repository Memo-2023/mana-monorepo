<!--
  SettingsPanel — frosted "page-shell"-style wrapper for a single settings
  section. Mirrors the workbench `.page-shell` aesthetic so /settings feels
  like the rest of the unified Mana app.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Anchor id used for deep-linking from the URL hash */
		id?: string;
		/** Apply default inner padding (set false when the child handles its own) */
		padded?: boolean;
		children: Snippet;
	}

	let { id, padded = true, children }: Props = $props();
</script>

<section {id} class="settings-panel scroll-mt-24" class:padded>
	{@render children()}
</section>

<style>
	.settings-panel {
		background: hsl(var(--color-card));
		border-radius: 1.25rem;
		border: 1px solid hsl(var(--color-border));
		box-shadow:
			0 2px 8px hsl(0 0% 0% / 0.06),
			0 1px 2px hsl(0 0% 0% / 0.04);
		overflow: hidden;
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
	}
	.settings-panel:hover {
		border-color: hsl(var(--color-border-strong, var(--color-border)));
	}
	.settings-panel.padded {
		padding: 1.5rem;
	}
	@media (min-width: 640px) {
		.settings-panel.padded {
			padding: 1.75rem;
		}
	}
</style>
