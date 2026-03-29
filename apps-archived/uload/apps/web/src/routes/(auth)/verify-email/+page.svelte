<script lang="ts">
	import { page } from '$app/stores';
	import Navigation from '$lib/components/Navigation.svelte';
</script>

<Navigation user={null} currentPath={$page.url.pathname} />

<div class="flex min-h-screen items-center justify-center bg-theme-background p-4">
	<div class="w-full max-w-md">
		<div class="rounded-xl border border-theme-border bg-theme-surface p-8 text-center shadow-xl">
			<svg
				class="mx-auto mb-4 h-12 w-12 animate-spin text-theme-primary"
				fill="none"
				viewBox="0 0 24 24"
			>
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
				></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>

			<h1 class="mb-2 text-2xl font-bold text-theme-text">
				Verifying Email / E-Mail wird verifiziert
			</h1>
			<p class="text-theme-text-muted">Please wait... / Bitte warten...</p>
		</div>
	</div>
</div>
