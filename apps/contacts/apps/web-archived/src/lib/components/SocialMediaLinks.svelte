<script lang="ts">
	/**
	 * SocialMediaLinks - Display social media links for a contact (view mode)
	 * Uses centralized SOCIAL_PLATFORMS config
	 */

	import { getSocialMediaEntries, hasSocialMedia } from '$lib/config/social-media';
	import type { Contact } from '$lib/api/contacts';
	import { ChatCircle } from '@manacore/shared-icons';

	interface Props {
		contact: Contact;
	}

	let { contact }: Props = $props();

	const entries = $derived(getSocialMediaEntries(contact as unknown as Record<string, unknown>));
	const hasAny = $derived(hasSocialMedia(contact as unknown as Record<string, unknown>));
</script>

{#if hasAny}
	<section class="detail-section">
		<div class="section-header">
			<div class="section-icon">
				<ChatCircle size={16} />
			</div>
			<h3 class="section-title">Social Media</h3>
		</div>
		<div class="social-links-grid">
			{#each entries as { platform, value }}
				{#if platform.hasLink && platform.buildUrl}
					<a
						href={platform.buildUrl(value)}
						target="_blank"
						rel="noopener noreferrer"
						class="social-link"
					>
						<span class="social-badge">{platform.badge}</span>
						<span class="social-link-text">{platform.name}</span>
					</a>
				{:else}
					<span class="social-link social-link-static">
						<span class="social-badge">{platform.badge}</span>
						<span class="social-link-text">{value}</span>
					</span>
				{/if}
			{/each}
		</div>
	</section>
{/if}

<style>
	.detail-section {
		background: hsl(var(--color-surface));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.875rem;
		padding: 1rem;
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding-bottom: 0.625rem;
		border-bottom: 1px solid hsl(var(--color-border) / 0.5);
		margin-bottom: 0.625rem;
	}

	.section-icon {
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 0.375rem;
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.section-icon svg {
		width: 1rem;
		height: 1rem;
	}

	.section-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}

	.social-links-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
	}

	.social-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.625rem;
		background: hsl(var(--color-muted) / 0.5);
		border-radius: 0.5rem;
		text-decoration: none;
		color: inherit;
		transition: all 0.2s ease;
	}

	.social-link:hover:not(.social-link-static) {
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
	}

	.social-link-static {
		cursor: default;
	}

	.social-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 0.375rem;
		background: hsl(var(--color-primary) / 0.15);
		color: hsl(var(--color-primary));
		font-size: 0.625rem;
		font-weight: 700;
		flex-shrink: 0;
	}

	.social-link-text {
		font-size: 0.8125rem;
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	@media (max-width: 480px) {
		.social-links-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
