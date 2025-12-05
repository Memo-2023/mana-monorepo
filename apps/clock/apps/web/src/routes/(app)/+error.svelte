<script lang="ts">
	import { page } from '$app/stores';

	function handleGoHome() {
		window.location.href = '/';
	}

	function handleGoBack() {
		window.history.back();
	}
</script>

<svelte:head>
	<title>Error - Clock</title>
</svelte:head>

<div class="error-page">
	<div class="error-container">
		<div class="error-icon">
			{#if $page.status === 404}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="80"
					height="80"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
				>
					<circle cx="12" cy="12" r="10"></circle>
					<polyline points="12 6 12 12 16 14"></polyline>
				</svg>
			{:else}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="80"
					height="80"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
				>
					<circle cx="12" cy="12" r="10"></circle>
					<line x1="12" y1="8" x2="12" y2="12"></line>
					<line x1="12" y1="16" x2="12.01" y2="16"></line>
				</svg>
			{/if}
		</div>

		<h1>{$page.status || 500}</h1>

		{#if $page.status === 404}
			<h2>Seite nicht gefunden</h2>
			<p>Die Seite, die du suchst, existiert nicht oder wurde verschoben.</p>
		{:else if $page.status === 500}
			<h2>Serverfehler</h2>
			<p>Es ist ein Fehler auf dem Server aufgetreten. Bitte versuche es später erneut.</p>
		{:else}
			<h2>Etwas ist schiefgelaufen</h2>
			<p>{$page.error?.message || 'Ein unerwarteter Fehler ist aufgetreten.'}</p>
		{/if}

		<div class="error-actions">
			<button class="btn btn-primary" onclick={handleGoHome}> Zur Startseite </button>
			<button class="btn btn-secondary" onclick={handleGoBack}> Zurück </button>
		</div>
	</div>
</div>

<style>
	.error-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		background: hsl(var(--color-background));
	}

	.error-container {
		max-width: 600px;
		text-align: center;
	}

	.error-icon {
		margin: 0 auto 2rem;
		color: hsl(var(--color-muted-foreground));
		opacity: 0.6;
	}

	h1 {
		font-size: 6rem;
		font-weight: 700;
		color: hsl(var(--color-primary));
		margin: 0 0 1rem 0;
		line-height: 1;
	}

	h2 {
		font-size: 1.75rem;
		color: hsl(var(--color-foreground));
		margin: 0 0 1rem 0;
	}

	p {
		font-size: 1.125rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0 0 2rem 0;
		line-height: 1.6;
	}

	.error-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	@media (max-width: 768px) {
		.error-page {
			padding: 1.5rem;
		}

		h1 {
			font-size: 4rem;
		}

		h2 {
			font-size: 1.5rem;
		}

		p {
			font-size: 1rem;
		}

		.error-actions {
			flex-direction: column;
			width: 100%;
		}

		.error-actions .btn {
			width: 100%;
		}
	}
</style>
