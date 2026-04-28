<!--
  EmailPreview — shared iframe-based preview for desktop and mobile.

  Uses srcdoc instead of a blob URL so we don't have to manage URL
  revocation, and srcdoc makes the iframe treat the content as a
  same-origin-ish document (but sandboxed — no top navigation).

  The `viewport` prop controls iframe width so one component powers
  both Desktop (640px) and Mobile (375px) views.
-->
<script lang="ts">
	interface Props {
		html: string;
		/** Display width in CSS pixels. Height adjusts to content. */
		viewport: 'desktop' | 'mobile';
	}

	let { html, viewport }: Props = $props();

	// iPhone 14 is 390 CSS px, but 375 is the well-known legacy default
	// that most "does this look ok on iPhone?" previews use. Wider than
	// 640 on desktop gets cramped in the composer split-view.
	const width = $derived(viewport === 'mobile' ? 375 : 640);
</script>

<div class="preview-shell" class:mobile={viewport === 'mobile'}>
	<div class="device-chrome">
		<span class="dot r"></span>
		<span class="dot y"></span>
		<span class="dot g"></span>
		<span class="device-label">{viewport === 'mobile' ? 'Mobile' : 'Desktop'}</span>
	</div>
	<iframe
		title="Vorschau {viewport}"
		srcdoc={html}
		sandbox="allow-same-origin"
		loading="lazy"
		style="width:{width}px;"
	></iframe>
</div>

<style>
	.preview-shell {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0;
		padding: 1rem;
		background: var(--color-surface-muted, #f1f5f9);
		border-radius: 0.75rem;
	}

	.device-chrome {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.5rem 0.75rem;
		background: #e2e8f0;
		border-radius: 0.5rem 0.5rem 0 0;
		width: var(--chrome-w, 640px);
		max-width: 100%;
		font-size: 0.75rem;
		color: #64748b;
	}

	.preview-shell.mobile .device-chrome {
		--chrome-w: 375px;
	}

	.dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
	}

	.dot.r {
		background: #ef4444;
	}
	.dot.y {
		background: #f59e0b;
	}
	.dot.g {
		background: #22c55e;
	}

	.device-label {
		margin-left: auto;
	}

	iframe {
		max-width: 100%;
		height: 600px;
		border: 0;
		background: white;
		border-radius: 0 0 0.5rem 0.5rem;
		box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
	}
</style>
