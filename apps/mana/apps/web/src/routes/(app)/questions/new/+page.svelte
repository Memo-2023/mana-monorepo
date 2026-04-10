<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import { db } from '$lib/data/database';
	import { encryptRecord } from '$lib/data/crypto';
	import { useAllCollections } from '$lib/modules/questions/queries';
	import type { ResearchDepth, QuestionPriority } from '$lib/modules/questions/types';
	import { ArrowLeft, Lightning, Clock, Sparkle } from '@mana/shared-icons';

	const allCollections = useAllCollections();
	let collections = $derived(allCollections.value);

	let title = $state('');
	let description = $state('');
	let collectionId = $state<string | undefined>(undefined);
	let tags = $state<string[]>([]);
	let tagInput = $state('');
	let priority = $state<QuestionPriority>('normal');
	let researchDepth = $state<ResearchDepth>('standard');

	let loading = $state(false);
	let error = $state<string | null>(null);

	const depthOptions: {
		value: ResearchDepth;
		label: string;
		description: string;
		icon: typeof Lightning;
	}[] = [
		{
			value: 'quick',
			label: 'Schnell',
			description: '5 Quellen, schnelle Ergebnisse',
			icon: Lightning,
		},
		{ value: 'standard', label: 'Standard', description: '15 Quellen, ausgewogen', icon: Clock },
		{ value: 'deep', label: 'Tiefgehend', description: '30+ Quellen, umfassend', icon: Sparkle },
	];

	function addTag() {
		const tag = tagInput.trim().toLowerCase();
		if (tag && !tags.includes(tag)) {
			tags = [...tags, tag];
		}
		tagInput = '';
	}

	function removeTag(tag: string) {
		tags = tags.filter((t) => t !== tag);
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (!title.trim()) {
			error = 'Bitte gib eine Frage ein';
			return;
		}

		loading = true;
		error = null;

		try {
			const now = new Date().toISOString();
			const id = crypto.randomUUID();

			const row: Record<string, unknown> = {
				id,
				collectionId: collectionId || null,
				title: title.trim(),
				description: description.trim() || null,
				status: 'open' as const,
				priority,
				// Unwrap the Svelte 5 $state proxy — Dexie / mana-sync's
				// _pendingChanges hook structured-clones the row and proxies
				// throw DataCloneError. $state.snapshot() returns a plain
				// deep copy.
				tags: $state.snapshot(tags),
				researchDepth,
				createdAt: now,
				updatedAt: now,
			};
			await encryptRecord('questions', row);
			await db.table('questions').add(row);

			goto(`/questions/${id}`);
		} catch (e) {
			error = 'Frage konnte nicht erstellt werden';
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Neue Frage - Mana</title>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-6">
	<!-- Header -->
	<div>
		<a
			href="/questions"
			class="mb-4 inline-flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
		>
			<ArrowLeft class="h-4 w-4" />
			Zurueck zu Fragen
		</a>
		<h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">Neue Frage</h1>
		<p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
			Stelle eine Frage und lass die KI recherchieren
		</p>
	</div>

	<form onsubmit={handleSubmit} class="space-y-6">
		{#if error}
			<div
				class="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400"
			>
				{error}
			</div>
		{/if}

		<!-- Question Title -->
		<div>
			<label for="title" class="mb-2 block text-sm font-medium text-[hsl(var(--foreground))]">
				Deine Frage
			</label>
			<input
				type="text"
				id="title"
				bind:value={title}
				placeholder="Was moechtest du wissen?"
				class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-4 py-3 text-lg text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
			/>
		</div>

		<!-- Description -->
		<div>
			<label for="description" class="mb-2 block text-sm font-medium text-[hsl(var(--foreground))]">
				Kontext <span class="text-[hsl(var(--muted-foreground))]">(optional)</span>
			</label>
			<textarea
				id="description"
				bind:value={description}
				placeholder="Zusaetzliche Details oder Kontext..."
				rows="3"
				class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-4 py-3 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
			></textarea>
		</div>

		<!-- Collection -->
		{#if collections.length > 0}
			<div>
				<label
					for="collection"
					class="mb-2 block text-sm font-medium text-[hsl(var(--foreground))]"
				>
					Sammlung
				</label>
				<select
					id="collection"
					bind:value={collectionId}
					class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-4 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
				>
					<option value={undefined}>Keine Sammlung</option>
					{#each collections as collection}
						<option value={collection.id}>{collection.name}</option>
					{/each}
				</select>
			</div>
		{/if}

		<!-- Tags -->
		<div>
			<label for="tags" class="mb-2 block text-sm font-medium text-[hsl(var(--foreground))]">
				Tags
			</label>
			<div class="mb-2 flex flex-wrap gap-2">
				{#each tags as tag}
					<span
						class="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--muted))] px-3 py-1 text-sm text-[hsl(var(--foreground))]"
					>
						{tag}
						<button
							type="button"
							onclick={() => removeTag(tag)}
							class="ml-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
						>
							&times;
						</button>
					</span>
				{/each}
			</div>
			<input
				type="text"
				id="tags"
				bind:value={tagInput}
				onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
				placeholder="Tag eingeben und Enter druecken"
				class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-4 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
			/>
		</div>

		<!-- Research Depth -->
		<div>
			<span class="mb-2 block text-sm font-medium text-[hsl(var(--foreground))]">
				Recherchetiefe
			</span>
			<div class="grid grid-cols-3 gap-3">
				{#each depthOptions as option}
					{@const OptionIcon = option.icon}
					<button
						type="button"
						onclick={() => (researchDepth = option.value)}
						class="rounded-lg border-2 p-4 text-left transition-all {researchDepth === option.value
							? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.05)]'
							: 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.3)]'}"
					>
						<OptionIcon class="mb-2 h-5 w-5 text-[hsl(var(--primary))]" />
						<div class="font-medium text-[hsl(var(--foreground))]">{option.label}</div>
						<div class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
							{option.description}
						</div>
					</button>
				{/each}
			</div>
		</div>

		<!-- Priority -->
		<div>
			<label for="priority" class="mb-2 block text-sm font-medium text-[hsl(var(--foreground))]">
				Prioritaet
			</label>
			<select
				id="priority"
				bind:value={priority}
				class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-4 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
			>
				<option value="low">Niedrig</option>
				<option value="normal">Normal</option>
				<option value="high">Hoch</option>
				<option value="urgent">Dringend</option>
			</select>
		</div>

		<!-- Submit -->
		<div class="flex gap-3">
			<a
				href="/questions"
				class="flex-1 rounded-lg border border-[hsl(var(--border))] px-4 py-3 text-center text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
			>
				Abbrechen
			</a>
			<button
				type="submit"
				disabled={loading || !title.trim()}
				class="flex-1 rounded-lg bg-[hsl(var(--primary))] px-4 py-3 text-sm font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90 disabled:opacity-50"
			>
				{loading ? $_('common.creating') : 'Frage stellen'}
			</button>
		</div>
	</form>
</div>
