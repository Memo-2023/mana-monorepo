<script lang="ts">
	import type { FooterModuleProps } from '../types';

	let { text = '', links = [], copyright = '', socialLinks = [] }: FooterModuleProps = $props();
</script>

<div class="footer-module border-t border-theme-border pt-4">
	{#if text}
		<p class="text-sm text-theme-text-muted">{text}</p>
	{/if}

	{#if links.length > 0}
		<div class="flex flex-wrap gap-4">
			{#each links as link}
				<a
					href={link.href}
					class="text-sm text-theme-accent hover:text-theme-accent-hover"
					target="_blank"
					rel="noopener noreferrer"
				>
					{#if link.icon}
						<span class="mr-1">{link.icon}</span>
					{/if}
					{link.label}
				</a>
			{/each}
		</div>
	{/if}

	{#if socialLinks.length > 0}
		<div class="mt-3 flex gap-3">
			{#each socialLinks as social}
				<a
					href={social.url}
					class="text-theme-text-muted hover:text-theme-text"
					title={social.platform}
					target="_blank"
					rel="noopener noreferrer"
				>
					{#if social.icon}
						<span class="text-lg">{social.icon}</span>
					{:else}
						<span class="text-sm">{social.platform}</span>
					{/if}
				</a>
			{/each}
		</div>
	{/if}

	{#if copyright}
		<p class="mt-3 text-xs text-theme-text-muted">{copyright}</p>
	{/if}
</div>
