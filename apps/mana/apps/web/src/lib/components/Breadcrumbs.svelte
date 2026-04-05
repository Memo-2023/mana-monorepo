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
		color: var(--color-muted-foreground, #94a3b8);
		font-size: 11px;
	}

	.crumb-link {
		color: var(--color-muted-foreground, #94a3b8);
		text-decoration: none;
		transition: color 0.15s;
	}

	.crumb-link:hover {
		color: var(--color-primary, #6366f1);
	}

	.crumb-current {
		color: var(--color-foreground, #f1f5f9);
		font-weight: 500;
	}
</style>
