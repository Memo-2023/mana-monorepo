<script lang="ts">
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { collectionsStore } from '$lib/stores/collections.svelte';
	import { DEFAULT_TEMPLATES } from '@inventar/shared';
	import type { CollectionSchema, Template } from '@inventar/shared';
	import SchemaEditor from '$lib/components/fields/SchemaEditor.svelte';

	let step = $state<'template' | 'details'>('template');
	let selectedTemplate = $state<Template | null>(null);
	let name = $state('');
	let description = $state('');
	let icon = $state('');
	let schema = $state<CollectionSchema>({ fields: [] });

	function selectTemplate(template: Template) {
		selectedTemplate = template;
		if (template.id !== 'custom') {
			name = template.name;
			icon = template.icon;
		}
		schema = { fields: [...template.schema.fields] };
		step = 'details';
	}

	function handleCreate() {
		if (!name.trim()) return;
		collectionsStore.create({
			name: name.trim(),
			description: description.trim() || undefined,
			icon: icon || undefined,
			schema,
			templateId: selectedTemplate?.id,
		});
		goto('/');
	}

	const inputClass =
		'w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-4 py-3 text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]';
</script>

<svelte:head>
	<title>{$_('collection.create')} | Inventar</title>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-6">
	<div class="flex items-center gap-3">
		<button
			onclick={() => (step === 'details' && selectedTemplate ? (step = 'template') : goto('/'))}
			class="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</button>
		<h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">{$_('collection.create')}</h1>
	</div>

	{#if step === 'template'}
		<!-- Template Selection -->
		<div>
			<h2 class="mb-4 text-lg font-semibold text-[hsl(var(--foreground))]">
				{$_('collection.selectTemplate')}
			</h2>
			<div class="grid gap-3 sm:grid-cols-2">
				{#each DEFAULT_TEMPLATES as template}
					<button
						onclick={() => selectTemplate(template)}
						class="item-card rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-left transition-all hover:border-[hsl(var(--primary)/0.3)]"
					>
						<div class="flex items-center gap-3">
							<span class="text-2xl">{template.icon}</span>
							<div>
								<h3 class="font-semibold text-[hsl(var(--foreground))]">{template.name}</h3>
								<p class="text-xs text-[hsl(var(--muted-foreground))]">{template.description}</p>
							</div>
						</div>
						{#if template.schema.fields.length > 0}
							<div class="mt-3 flex flex-wrap gap-1">
								{#each template.schema.fields as field}
									<span
										class="rounded bg-[hsl(var(--muted))] px-1.5 py-0.5 text-[10px] text-[hsl(var(--muted-foreground))]"
									>
										{field.name}
									</span>
								{/each}
							</div>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{:else}
		<!-- Collection Details -->
		<div class="space-y-4">
			<div class="flex gap-3">
				<div class="flex-shrink-0">
					<input
						type="text"
						bind:value={icon}
						placeholder="📁"
						class="h-12 w-12 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] text-center text-2xl"
						maxlength="2"
					/>
				</div>
				<input
					type="text"
					bind:value={name}
					placeholder={$_('collection.name')}
					class="{inputClass} flex-1"
				/>
			</div>

			<textarea
				bind:value={description}
				placeholder={$_('collection.description')}
				rows="2"
				class={inputClass}
			></textarea>

			<!-- Schema Editor -->
			<div>
				<h3 class="mb-3 text-sm font-semibold text-[hsl(var(--foreground))]">
					{$_('collection.customFields')}
				</h3>
				<SchemaEditor fields={schema.fields} onchange={(fields) => (schema = { fields })} />
			</div>

			<!-- Actions -->
			<div class="flex justify-end gap-3 pt-4">
				<button
					onclick={() => goto('/')}
					class="rounded-lg border border-[hsl(var(--border))] px-4 py-2 text-sm text-[hsl(var(--foreground))]"
				>
					{$_('common.cancel')}
				</button>
				<button
					onclick={handleCreate}
					disabled={!name.trim()}
					class="rounded-lg bg-[hsl(var(--primary))] px-6 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))] disabled:opacity-50"
				>
					{$_('common.create')}
				</button>
			</div>
		</div>
	{/if}
</div>
