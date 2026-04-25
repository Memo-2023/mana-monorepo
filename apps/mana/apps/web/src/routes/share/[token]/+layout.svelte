<!--
  Share-Link layout — minimal chrome for anonymous visitors.
  No app nav, no auth, no sidebar. Just the snapshot + a quiet
  "shared via Mana" footer + a CTA for signup.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	let { children }: { children: Snippet } = $props();
</script>

<div class="share-shell">
	<main class="share-main">
		{@render children()}
	</main>

	<footer class="share-footer">
		<span class="share-footer__meta">Geteilt via Mana</span>
		<a class="share-footer__cta" href="https://mana.how" target="_blank" rel="noopener noreferrer">
			mana.how →
		</a>
	</footer>
</div>

<style>
	.share-shell {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		background: #fafafa;
		color: #111;
		font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif;
	}
	.share-main {
		flex: 1;
		max-width: 640px;
		margin: 0 auto;
		width: 100%;
		padding: 2.5rem 1.5rem;
	}
	.share-footer {
		padding: 1.5rem;
		text-align: center;
		border-top: 1px solid rgba(0, 0, 0, 0.08);
		font-size: 0.8125rem;
		color: #6b7280;
		display: flex;
		justify-content: center;
		gap: 0.5rem;
	}
	.share-footer__cta {
		color: #4f46e5;
		text-decoration: none;
	}
	.share-footer__cta:hover {
		text-decoration: underline;
	}

	@media (prefers-color-scheme: dark) {
		.share-shell {
			background: #0f1216;
			color: #f4f4f5;
		}
		.share-footer {
			color: #9ca3af;
			border-top-color: rgba(255, 255, 255, 0.08);
		}
		.share-footer__cta {
			color: #818cf8;
		}
	}
</style>
