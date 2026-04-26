<script lang="ts">
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { SITE_TEMPLATES, type SiteTemplate } from '../templates';
	import {
		sitesStore,
		InvalidSlugError,
		DuplicateSlugError,
		UnknownTemplateError,
	} from '../stores/sites.svelte';
	import { isValidSlug } from '../constants';

	let selected = $state<SiteTemplate | null>(null);
	let draftName = $state('');
	let draftSlug = $state('');
	let creating = $state(false);
	let error = $state<string | null>(null);

	function slugify(v: string): string {
		return v
			.toLowerCase()
			.normalize('NFKD')
			.replace(/[̀-ͯ]/g, '')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 40);
	}

	function onNameInput(v: string) {
		draftName = v;
		if (!draftSlug || draftSlug === slugify(draftName.slice(0, draftName.length - 1))) {
			draftSlug = slugify(v);
		}
	}

	function pick(template: SiteTemplate) {
		selected = template;
		error = null;
		if (!draftName) draftName = template.name;
		if (!draftSlug) draftSlug = slugify(template.name);
	}

	async function submit() {
		error = null;
		if (!selected) {
			error = $_('website.template_picker.err_select_template');
			return;
		}
		if (!draftName.trim() || !isValidSlug(draftSlug)) {
			error = $_('website.template_picker.err_invalid_form');
			return;
		}
		creating = true;
		try {
			const result = await sitesStore.applyTemplate(selected.id, {
				name: draftName.trim(),
				slug: draftSlug,
			});
			await goto(`/website/${result.siteId}/edit/${result.homePageId}`);
		} catch (err) {
			if (
				err instanceof InvalidSlugError ||
				err instanceof DuplicateSlugError ||
				err instanceof UnknownTemplateError
			) {
				error = err.message;
			} else {
				error = err instanceof Error ? err.message : String(err);
			}
		} finally {
			creating = false;
		}
	}
</script>

<div class="wb-templates">
	<header class="wb-templates__head">
		<div>
			<h2>{$_('website.template_picker.heading')}</h2>
			<p>{$_('website.template_picker.subtitle')}</p>
		</div>
		<a class="wb-templates__back" href="/website">{$_('website.template_picker.action_back')}</a>
	</header>

	<ul class="wb-templates__grid">
		{#each SITE_TEMPLATES as template (template.id)}
			<li>
				<button
					class="wb-template"
					class:wb-template--selected={selected?.id === template.id}
					onclick={() => pick(template)}
				>
					<div class="wb-template__preview" data-tag={template.tag}>
						<span class="wb-template__tag">{template.tag}</span>
					</div>
					<div class="wb-template__body">
						<h3>{template.name}</h3>
						<p>{template.description}</p>
						<small
							>{template.pages.length === 1
								? $_('website.template_picker.pages_count_singular', {
										values: { count: template.pages.length },
									})
								: $_('website.template_picker.pages_count_plural', {
										values: { count: template.pages.length },
									})}</small
						>
					</div>
				</button>
			</li>
		{/each}
	</ul>

	{#if selected}
		<section class="wb-templates__config" aria-labelledby="wb-config-title">
			<h3 id="wb-config-title">
				{$_('website.template_picker.config_title', { values: { name: selected.name } })}
			</h3>
			<div class="wb-row">
				<label class="wb-field">
					<span>{$_('website.template_picker.label_name')}</span>
					<input
						type="text"
						value={draftName}
						oninput={(e) => onNameInput(e.currentTarget.value)}
						placeholder={$_('website.template_picker.placeholder_name')}
					/>
				</label>
				<label class="wb-field">
					<span>{$_('website.template_picker.label_slug')}</span>
					<div class="wb-slug">
						<span class="wb-slug__prefix">/s/</span>
						<input
							type="text"
							value={draftSlug}
							oninput={(e) => (draftSlug = e.currentTarget.value.toLowerCase())}
						/>
					</div>
				</label>
			</div>

			{#if error}
				<p class="wb-error">{error}</p>
			{/if}

			<div class="wb-actions">
				<button class="wb-btn wb-btn--ghost" onclick={() => (selected = null)} disabled={creating}>
					{$_('website.template_picker.action_cancel')}
				</button>
				<button class="wb-btn wb-btn--primary" onclick={submit} disabled={creating}>
					{creating
						? $_('website.template_picker.action_creating')
						: $_('website.template_picker.action_create', { values: { name: selected.name } })}
				</button>
			</div>
		</section>
	{/if}
</div>

<style>
	.wb-templates {
		padding: 1.5rem;
		max-width: 64rem;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.wb-templates__head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}
	.wb-templates__head h2 {
		margin: 0;
		font-size: 1.375rem;
	}
	.wb-templates__head p {
		margin: 0.25rem 0 0;
		font-size: 0.9375rem;
		opacity: 0.65;
		max-width: 36rem;
	}
	.wb-templates__back {
		color: inherit;
		text-decoration: none;
		opacity: 0.6;
		font-size: 0.875rem;
		padding: 0.25rem 0.5rem;
	}
	.wb-templates__back:hover {
		opacity: 1;
	}
	.wb-templates__grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
		gap: 1rem;
	}
	.wb-template {
		display: flex;
		flex-direction: column;
		background: transparent;
		border: 2px solid rgba(255, 255, 255, 0.08);
		border-radius: 0.75rem;
		overflow: hidden;
		padding: 0;
		cursor: pointer;
		color: inherit;
		text-align: left;
		transition:
			border-color 0.15s,
			background 0.15s;
	}
	.wb-template:hover {
		border-color: rgba(99, 102, 241, 0.5);
	}
	.wb-template--selected {
		border-color: rgba(99, 102, 241, 1) !important;
		background: rgba(99, 102, 241, 0.06);
	}
	.wb-template__preview {
		height: 7rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.15));
	}
	.wb-template__preview[data-tag='event'] {
		background: linear-gradient(135deg, rgba(244, 63, 94, 0.18), rgba(249, 115, 22, 0.15));
	}
	.wb-template__preview[data-tag='geschäft'] {
		background: linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(20, 184, 166, 0.15));
	}
	.wb-template__preview[data-tag='leer'] {
		background: repeating-linear-gradient(
			45deg,
			rgba(255, 255, 255, 0.03),
			rgba(255, 255, 255, 0.03) 10px,
			rgba(255, 255, 255, 0.06) 10px,
			rgba(255, 255, 255, 0.06) 20px
		);
	}
	.wb-template__tag {
		padding: 0.2rem 0.65rem;
		border-radius: 9999px;
		background: rgba(0, 0, 0, 0.3);
		color: white;
		font-size: 0.75rem;
		text-transform: lowercase;
	}
	.wb-template__body {
		padding: 0.75rem 0.875rem;
	}
	.wb-template__body h3 {
		margin: 0;
		font-size: 1rem;
	}
	.wb-template__body p {
		margin: 0.25rem 0 0.5rem;
		font-size: 0.8125rem;
		opacity: 0.7;
		line-height: 1.4;
	}
	.wb-template__body small {
		font-size: 0.7rem;
		opacity: 0.55;
	}

	.wb-templates__config {
		padding: 1.25rem;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.wb-templates__config h3 {
		margin: 0;
		font-size: 1rem;
	}
	.wb-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}
	.wb-field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.wb-field > span {
		font-size: 0.75rem;
		font-weight: 500;
		opacity: 0.7;
	}
	.wb-field input {
		padding: 0.5rem 0.625rem;
		border-radius: 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.04);
		color: inherit;
		font-size: 0.875rem;
	}
	.wb-slug {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0 0.5rem;
		border-radius: 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.04);
	}
	.wb-slug__prefix {
		font-size: 0.875rem;
		opacity: 0.55;
		font-family: ui-monospace, monospace;
	}
	.wb-slug input {
		border: none;
		padding-left: 0;
		background: transparent;
	}
	.wb-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}
	.wb-error {
		margin: 0;
		color: rgb(248, 113, 113);
		font-size: 0.8125rem;
	}
	.wb-btn {
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		border: none;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
	}
	.wb-btn--ghost {
		background: transparent;
		color: inherit;
		border: 1px solid rgba(255, 255, 255, 0.12);
	}
	.wb-btn--primary {
		background: rgba(99, 102, 241, 0.9);
		color: white;
	}
	.wb-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
