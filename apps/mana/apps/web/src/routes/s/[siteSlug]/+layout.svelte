<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';

	interface Props {
		data: LayoutData;
		children: Snippet;
	}

	let { data, children }: Props = $props();

	const site = $derived(data.snapshot.site);
	const theme = $derived(site.theme);

	// Theme preset → CSS variables. Three presets for M3+, classic for M2.
	const themeVars = $derived.by(() => {
		const preset = theme?.preset ?? 'classic';
		const base =
			preset === 'modern'
				? { primary: '#6366f1', bg: '#0b0d12', fg: '#f5f6f8' }
				: preset === 'warm'
					? { primary: '#f97316', bg: '#1a140f', fg: '#f7ede2' }
					: { primary: '#3b82f6', bg: '#ffffff', fg: '#0f172a' };
		const overrides = theme?.overrides ?? {};
		const primary = overrides.primary ?? base.primary;
		const bg = overrides.background ?? base.bg;
		const fg = overrides.foreground ?? base.fg;
		return `--wb-primary:${primary};--wb-bg:${bg};--wb-fg:${fg};`;
	});

	const navItems = $derived(site.navConfig?.items ?? []);
	const footer = $derived(site.footerConfig);
</script>

<svelte:head>
	<title>{site.name}</title>
	{#if site.settings?.favicon}
		<link rel="icon" href={site.settings.favicon} />
	{/if}
	{#if site.settings?.defaultSeo?.description}
		<meta name="description" content={site.settings.defaultSeo.description} />
	{/if}
</svelte:head>

<div class="wb-public" style={themeVars}>
	{#if navItems.length > 0}
		<nav class="wb-public__nav">
			<a class="wb-public__brand" href="/s/{site.slug}">{site.name}</a>
			<ul>
				{#each navItems as item (item.pagePath)}
					<li>
						<a href={`/s/${site.slug}${item.pagePath === '/' ? '' : item.pagePath}`}>
							{item.label}
						</a>
					</li>
				{/each}
			</ul>
		</nav>
	{:else}
		<nav class="wb-public__nav wb-public__nav--minimal">
			<a class="wb-public__brand" href="/s/{site.slug}">{site.name}</a>
		</nav>
	{/if}

	<main class="wb-public__main">
		{@render children()}
	</main>

	{#if footer && (footer.text || (footer.links && footer.links.length > 0))}
		<footer class="wb-public__footer">
			{#if footer.text}
				<p>{footer.text}</p>
			{/if}
			{#if footer.links && footer.links.length > 0}
				<ul>
					{#each footer.links as link (link.href)}
						<li><a href={link.href}>{link.label}</a></li>
					{/each}
				</ul>
			{/if}
		</footer>
	{/if}
</div>

<style>
	:global(html),
	:global(body) {
		margin: 0;
		padding: 0;
	}
	.wb-public {
		min-height: 100vh;
		background: var(--wb-bg);
		color: var(--wb-fg);
		display: flex;
		flex-direction: column;
		font-family:
			system-ui,
			-apple-system,
			'Segoe UI',
			Roboto,
			sans-serif;
	}
	.wb-public__nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid rgba(127, 127, 127, 0.15);
	}
	.wb-public__nav--minimal {
		border-bottom: none;
	}
	.wb-public__brand {
		font-weight: 600;
		color: inherit;
		text-decoration: none;
		font-size: 1.05rem;
	}
	.wb-public__nav ul {
		list-style: none;
		display: flex;
		gap: 1.5rem;
		margin: 0;
		padding: 0;
	}
	.wb-public__nav a {
		color: inherit;
		text-decoration: none;
		font-size: 0.9375rem;
	}
	.wb-public__nav a:hover {
		color: var(--wb-primary);
	}
	.wb-public__main {
		flex: 1 1 auto;
	}
	.wb-public__footer {
		padding: 2rem 1.5rem;
		border-top: 1px solid rgba(127, 127, 127, 0.15);
		text-align: center;
		font-size: 0.875rem;
		opacity: 0.7;
	}
	.wb-public__footer ul {
		list-style: none;
		display: flex;
		justify-content: center;
		gap: 1.25rem;
		padding: 0;
		margin: 0.75rem 0 0;
	}
	.wb-public__footer a {
		color: inherit;
	}
</style>
