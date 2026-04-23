<script lang="ts">
	import type { BlockRenderProps } from '../types';
	import type { FormProps } from './schema';

	let { block, mode }: BlockRenderProps<FormProps> = $props();

	const isPublic = $derived(mode === 'public');

	// Submission state — only active in public mode. In edit/preview the
	// form is a static preview; clicking submit does nothing.
	let values = $state<Record<string, string>>({});
	let submitting = $state(false);
	let submitted = $state(false);
	let errorText = $state<string | null>(null);
	// Honeypot — real users never fill this. Bots usually do.
	let honeypot = $state('');

	async function onSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!isPublic) return; // edit/preview — no network call

		if (honeypot.trim()) {
			// Silent fail — behave like success to the bot.
			submitted = true;
			return;
		}

		submitting = true;
		errorText = null;
		try {
			// Build payload from declared fields only (ignores any extra
			// input) so clients can't inject surprise keys.
			const payload: Record<string, string> = {};
			for (const field of block.props.fields) {
				payload[field.name] = values[field.name] ?? '';
			}

			// The site slug lives in the URL path: /s/<slug>/... The
			// proxy route at /s/[slug]/__submit/[blockId] forwards to the
			// mana-api public endpoint with CORS/rate-limit handled
			// there. Works identically for the home page (`/s/slug`) and
			// nested pages (`/s/slug/about`).
			const pathParts = window.location.pathname.split('/');
			const slug = pathParts[2] ?? '';
			if (!slug) {
				throw new Error('Konnte Website-Slug aus URL nicht ableiten');
			}
			const res = await fetch(`/s/${slug}/__submit/${block.id}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});
			if (!res.ok) {
				const body = (await res.json().catch(() => ({}))) as { error?: string };
				throw new Error(body.error ?? `Fehler (${res.status})`);
			}
			submitted = true;
		} catch (err) {
			errorText = err instanceof Error ? err.message : String(err);
		} finally {
			submitting = false;
		}
	}
</script>

<section class="wb-form" data-mode={mode}>
	<div class="wb-form__inner">
		{#if block.props.title}
			<h2>{block.props.title}</h2>
		{/if}
		{#if block.props.description}
			<p class="wb-form__description">{block.props.description}</p>
		{/if}

		{#if submitted}
			<div class="wb-form__success">{block.props.successMessage}</div>
		{:else}
			<form onsubmit={onSubmit} novalidate>
				{#each block.props.fields as field (field.name)}
					<label class="wb-form__field">
						<span>
							{field.label}
							{#if field.required}<span class="wb-form__required">*</span>{/if}
						</span>
						{#if field.type === 'textarea'}
							<textarea
								name={field.name}
								rows="4"
								placeholder={field.placeholder}
								required={field.required}
								maxlength={field.maxLength}
								bind:value={values[field.name]}
							></textarea>
						{:else}
							<input
								name={field.name}
								type={field.type}
								placeholder={field.placeholder}
								required={field.required}
								maxlength={field.maxLength}
								bind:value={values[field.name]}
							/>
						{/if}
						{#if field.helpText}
							<small>{field.helpText}</small>
						{/if}
					</label>
				{/each}

				<!-- Honeypot: hidden via CSS (not `type=hidden`), bots see + fill. -->
				<label class="wb-form__honeypot" aria-hidden="true">
					<span>Nicht ausfüllen</span>
					<input type="text" tabindex="-1" autocomplete="off" bind:value={honeypot} />
				</label>

				{#if errorText}
					<p class="wb-form__error">{errorText}</p>
				{/if}

				<button type="submit" class="wb-form__submit" disabled={submitting}>
					{submitting ? 'Sende…' : block.props.submitLabel}
				</button>
			</form>
		{/if}
	</div>
</section>

<style>
	.wb-form {
		padding: 3rem 1.5rem;
		display: flex;
		justify-content: center;
	}
	.wb-form__inner {
		max-width: 36rem;
		width: 100%;
	}
	.wb-form h2 {
		margin: 0 0 0.5rem;
		font-size: 1.5rem;
	}
	.wb-form__description {
		margin: 0 0 1.5rem;
		opacity: 0.7;
		line-height: 1.5;
	}
	.wb-form__success {
		padding: 1rem 1.25rem;
		background: rgba(16, 185, 129, 0.15);
		border: 1px solid rgba(16, 185, 129, 0.3);
		border-radius: 0.5rem;
		color: rgb(16, 185, 129);
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.wb-form__field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.wb-form__field > span {
		font-size: 0.8125rem;
		font-weight: 500;
	}
	.wb-form__required {
		color: rgb(220, 38, 38);
		margin-left: 0.15rem;
	}
	.wb-form__field input,
	.wb-form__field textarea {
		padding: 0.625rem 0.75rem;
		border-radius: var(--wb-radius, 0.375rem);
		border: 1px solid var(--wb-border, rgba(127, 127, 127, 0.25));
		background: var(--wb-surface, rgba(255, 255, 255, 0.04));
		color: inherit;
		font-family: inherit;
		font-size: 0.9375rem;
	}
	.wb-form__field textarea {
		resize: vertical;
		min-height: 5rem;
	}
	.wb-form__field small {
		font-size: 0.75rem;
		opacity: 0.6;
	}
	.wb-form__honeypot {
		position: absolute;
		left: -9999px;
		width: 1px;
		height: 1px;
		overflow: hidden;
	}
	.wb-form__error {
		margin: 0;
		padding: 0.5rem 0.75rem;
		background: rgba(220, 38, 38, 0.1);
		border: 1px solid rgba(220, 38, 38, 0.3);
		border-radius: 0.375rem;
		color: rgb(220, 38, 38);
		font-size: 0.875rem;
	}
	.wb-form__submit {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 9999px;
		background: var(--wb-primary, rgba(99, 102, 241, 0.9));
		color: var(--wb-primary-fg, white);
		font-size: 0.9375rem;
		font-weight: 500;
		cursor: pointer;
		align-self: flex-start;
	}
	.wb-form__submit:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
