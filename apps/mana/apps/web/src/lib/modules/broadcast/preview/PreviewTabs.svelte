<!--
  PreviewTabs — Desktop / Mobile / Text switcher for the Preflight step.

  Lazily renders HTML + plaintext from the current campaign + settings.
  Re-derives on every change so the preview stays live as the user hops
  back to step 2 and edits.
-->
<script lang="ts">
	import EmailPreview from './EmailPreview.svelte';
	import { renderEmailHtml } from '../render/email-html';
	import { renderPlainText } from '../render/plain-text';
	import type { Campaign, BroadcastSettings, CampaignContent } from '../types';

	interface Props {
		campaign: Pick<Campaign, 'subject' | 'preheader' | 'fromName' | 'fromEmail'>;
		content: CampaignContent;
		settings: BroadcastSettings;
	}

	let { campaign, content, settings }: Props = $props();

	type Tab = 'desktop' | 'mobile' | 'text';
	let tab = $state<Tab>('desktop');

	const html = $derived(
		renderEmailHtml({
			tiptapHtml: content.html ?? '',
			campaign,
			settings,
		})
	);

	const plainText = $derived(
		renderPlainText({
			tiptapText: content.plainText ?? '',
			campaign,
			settings,
		})
	);
</script>

<div class="preview-tabs">
	<div class="tab-bar" role="tablist">
		<button
			type="button"
			class="tab"
			class:active={tab === 'desktop'}
			role="tab"
			aria-selected={tab === 'desktop'}
			onclick={() => (tab = 'desktop')}
		>
			🖥 Desktop
		</button>
		<button
			type="button"
			class="tab"
			class:active={tab === 'mobile'}
			role="tab"
			aria-selected={tab === 'mobile'}
			onclick={() => (tab = 'mobile')}
		>
			📱 Mobile
		</button>
		<button
			type="button"
			class="tab"
			class:active={tab === 'text'}
			role="tab"
			aria-selected={tab === 'text'}
			onclick={() => (tab = 'text')}
		>
			📝 Nur-Text
		</button>
	</div>

	{#if tab === 'desktop'}
		<EmailPreview {html} viewport="desktop" />
	{:else if tab === 'mobile'}
		<EmailPreview {html} viewport="mobile" />
	{:else}
		<div class="plain-text-preview">
			<pre>{plainText}</pre>
			<p class="hint">
				Der Text wird als <code>text/plain</code> zusätzlich zur HTML-Version verschickt — wichtig für
				Spam-Filter und Clients, die kein HTML anzeigen.
			</p>
		</div>
	{/if}
</div>

<style>
	.preview-tabs {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.tab-bar {
		display: flex;
		gap: 0.25rem;
		padding: 0.25rem;
		background: var(--color-surface-muted, #f1f5f9);
		border-radius: 0.4rem;
		width: fit-content;
	}

	.tab {
		padding: 0.4rem 0.9rem;
		background: transparent;
		border: 0;
		border-radius: 0.3rem;
		cursor: pointer;
		font-size: 0.85rem;
		color: var(--color-text-muted, #64748b);
	}

	.tab:hover {
		background: rgba(255, 255, 255, 0.5);
	}

	.tab.active {
		background: white;
		color: var(--color-text, #0f172a);
		font-weight: 500;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
	}

	.plain-text-preview {
		padding: 1rem;
		background: var(--color-surface-muted, #f1f5f9);
		border-radius: 0.5rem;
	}

	.plain-text-preview pre {
		background: white;
		padding: 1.25rem;
		border-radius: 0.4rem;
		font-size: 0.85rem;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		white-space: pre-wrap;
		word-wrap: break-word;
		border: 1px solid var(--color-border, #e2e8f0);
		max-height: 500px;
		overflow-y: auto;
		margin: 0;
	}

	.plain-text-preview .hint {
		margin: 0.75rem 0 0;
		font-size: 0.8rem;
		color: var(--color-text-muted, #64748b);
	}

	.plain-text-preview code {
		background: #e2e8f0;
		padding: 0.1rem 0.3rem;
		border-radius: 0.2rem;
		font-size: 0.8rem;
	}
</style>
