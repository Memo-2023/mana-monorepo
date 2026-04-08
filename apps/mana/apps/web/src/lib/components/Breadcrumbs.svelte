<script lang="ts">
	interface Crumb {
		label: string;
		href?: string;
	}

	let { items }: { items: Crumb[] } = $props();
</script>

<nav aria-label="Breadcrumb" class="breadcrumbs">
	{#each items as crumb, i}
		{#if i > 0}
			<span class="separator">/</span>
		{/if}
		{#if crumb.href && i < items.length - 1}
			<a href={crumb.href} class="crumb-link">{crumb.label}</a>
		{:else}
			<span class="crumb-current">{crumb.label}</span>
		{/if}
	{/each}
</nav>

<style>
	.breadcrumbs {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		margin-bottom: 4px;
	}

	.separator {
		color: hsl(var(--color-muted-foreground));
		font-size: 11px;
	}

	.crumb-link {
		color: hsl(var(--color-muted-foreground));
		text-decoration: none;
		transition: color 0.15s;
	}

	.crumb-link:hover {
		color: hsl(var(--color-primary));
	}

	.crumb-current {
		color: hsl(var(--color-foreground));
		font-weight: 500;
	}
</style>
