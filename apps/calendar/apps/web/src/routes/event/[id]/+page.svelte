<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// Redirect to main calendar page with event modal
	onMount(() => {
		const eventId = $page.params.id;
		goto(`/?event=${eventId}`, { replaceState: true });
	});
</script>

<div class="redirect-loading">
	<div class="spinner"></div>
	<p>Laden...</p>
</div>

<style>
	.redirect-loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 50vh;
		gap: 1rem;
		color: hsl(var(--color-muted-foreground));
	}

	.spinner {
		width: 2rem;
		height: 2rem;
		border: 3px solid hsl(var(--color-border));
		border-top-color: hsl(var(--color-primary));
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
