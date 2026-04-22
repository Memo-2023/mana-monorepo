<script lang="ts">
	import { goto } from '$app/navigation';
	import { CaretLeft } from '@mana/shared-icons';
	import { collectionsStore } from '$lib/modules/inventory/stores/collections.svelte';
	import {
		DEFAULT_TEMPLATES,
		type Template,
		type CollectionSchema,
	} from '$lib/modules/inventory/constants';
	import SchemaEditor from '$lib/modules/inventory/components/fields/SchemaEditor.svelte';

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

	async function handleCreate() {
		if (!name.trim()) return;
		await collectionsStore.create({
			name: name.trim(),
			description: description.trim() || undefined,
			icon: icon || undefined,
			schema,
			templateId: selectedTemplate?.id,
		});
		goto('/inventory');
	}

	const inputClass =
		'w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-input))] px-4 py-3 text-[hsl(var(--color-foreground))] placeholder:text-[hsl(var(--color-muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))]';
</script>

<svelte:head>
	<title>Neue Sammlung - Inventar - Mana</title>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-6">
	<div class="flex items-center gap-3">
		<button
			onclick={() =>
				step === 'details' && selectedTemplate ? (step = 'template') : goto('/inventory')}
			class="text-[hsl(var(--color-muted-foreground))] hover:text-[hsl(var(--color-foreground))]"
		>
			<CaretLeft size={20} />
		</button>
		<h1 class="text-2xl font-bold text-[hsl(var(--color-foreground))]">Neue Sammlung</h1>
	</div>

	{#if step === 'template'}
		<!-- Template Selection -->
		<div>
			<h2 class="mb-4 text-lg font-semibold text-[hsl(var(--color-foreground))]">Vorlage wahlen</h2>
			<div class="grid gap-3 sm:grid-cols-2">
				{#each DEFAULT_TEMPLATES as template}
					<button
						onclick={() => selectTemplate(template)}
						class="rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] p-4 text-left transition-colors hover:border-[hsl(var(--color-primary)/0.3)]"
					>
						<div class="flex items-center gap-3">
							<span class="text-2xl">{template.icon}</span>
							<div>
								<h3 class="font-semibold text-[hsl(var(--color-foreground))]">{template.name}</h3>
								<p class="text-xs text-[hsl(var(--color-muted-foreground))]">
									{template.description}
								</p>
							</div>
						</div>
						{#if template.schema.fields.length > 0}
							<div class="mt-3 flex flex-wrap gap-1">
								{#each template.schema.fields as field}
									<span
										class="rounded bg-[hsl(var(--color-muted))] px-1.5 py-0.5 text-[10px] text-[hsl(var(--color-muted-foreground))]"
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
						class="h-12 w-12 rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-input))] text-center text-2xl"
						maxlength="2"
					/>
				</div>
				<input
					type="text"
					bind:value={name}
					placeholder="Sammlungsname"
					class="{inputClass} flex-1"
				/>
			</div>

			<textarea
				bind:value={description}
				placeholder="Beschreibung (optional)"
				rows="2"
				class={inputClass}
			></textarea>

			<!-- Schema Editor -->
			<div>
				<h3 class="mb-3 text-sm font-semibold text-[hsl(var(--color-foreground))]">
					Eigene Felder
				</h3>
				<SchemaEditor fields={schema.fields} onchange={(fields) => (schema = { fields })} />
			</div>

			<!-- Actions -->
			<div class="flex justify-end gap-3 pt-4">
				<button
					onclick={() => goto('/inventory')}
					class="rounded-lg border border-[hsl(var(--color-border))] px-4 py-2 text-sm text-[hsl(var(--color-foreground))]"
				>
					Abbrechen
				</button>
				<button
					onclick={handleCreate}
					disabled={!name.trim()}
					class="rounded-lg bg-[hsl(var(--color-primary))] px-6 py-2 text-sm font-medium text-[hsl(var(--color-primary-foreground))] disabled:opacity-50"
				>
					Erstellen
				</button>
			</div>
		</div>
	{/if}
</div>
