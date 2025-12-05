<script lang="ts">
	import { _ } from 'svelte-i18n';

	let { children } = $props();
</script>

<div class="min-h-screen flex flex-col items-center justify-center bg-theme p-4">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
				<svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
					/>
				</svg>
			</div>
			<h1 class="text-2xl font-bold text-theme">{$_('app.name')}</h1>
			<p class="text-sm text-theme-secondary mt-1">{$_('app.tagline')}</p>
		</div>
		{@render children()}
	</div>
</div>
