<script lang="ts">
	import { formatDate, formatDateTime } from '$lib/i18n/format';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { ArrowLeft, Check, Trash, Plus, Link as LinkIcon, Star, X } from '@mana/shared-icons';
	import { wishesStore } from '../stores/wishes.svelte';
	import { useAllWishes, usePriceChecks } from '../queries';
	import type { PriceCheck } from '../types';

	const allWishes = useAllWishes();

	const wishId = $derived($page.params.id ?? '');
	const wish = $derived(allWishes.value.find((w) => w.id === wishId));

	let priceChecksQuery: { readonly value: PriceCheck[] } | null = $state(null);
	$effect(() => {
		if (wishId) {
			priceChecksQuery = usePriceChecks(wishId);
		}
	});
	const priceChecks = $derived(priceChecksQuery ?? { value: [] as PriceCheck[] });

	let editing = $state(false);
	let editTitle = $state('');
	let editDescription = $state('');
	let editTargetPrice = $state('');
	let editCategory = $state('');
	let newUrl = $state('');
	let newNote = $state('');

	function startEdit() {
		if (!wish) return;
		editTitle = wish.title;
		editDescription = wish.description ?? '';
		editTargetPrice = wish.targetPrice?.toString() ?? '';
		editCategory = wish.category ?? '';
		editing = true;
	}

	async function saveEdit() {
		if (!wish) return;
		await wishesStore.update(wish.id, {
			title: editTitle,
			description: editDescription || null,
			targetPrice: editTargetPrice ? parseFloat(editTargetPrice) : null,
			category: editCategory || null,
		});
		editing = false;
	}

	async function handleFulfill() {
		if (!wish) return;
		await wishesStore.fulfill(wish.id);
	}

	async function handleDelete() {
		if (!wish) return;
		if (confirm('Wunsch löschen?')) {
			await wishesStore.delete(wish.id);
			goto('/wishes');
		}
	}

	async function addUrl() {
		if (!wish || !newUrl.trim()) return;
		await wishesStore.addProductUrl(wish.id, newUrl.trim());
		newUrl = '';
	}

	async function removeUrl(url: string) {
		if (!wish) return;
		await wishesStore.removeProductUrl(wish.id, url);
	}

	async function addNote() {
		if (!wish || !newNote.trim()) return;
		await wishesStore.addNote(wish.id, newNote.trim());
		newNote = '';
	}

	function priorityLabel(p: string) {
		if (p === 'high') return 'Hoch';
		if (p === 'medium') return 'Mittel';
		return 'Niedrig';
	}

	const lowestPrice = $derived.by(() => {
		const checks = priceChecks.value;
		if (checks.length === 0) return null;
		return Math.min(...checks.map((c) => c.price));
	});
</script>

<svelte:head>
	<title>{wish?.title ?? 'Wunsch'} - Wünsche - Mana</title>
</svelte:head>

{#if !wish}
	<div class="flex items-center justify-center py-20">
		<p class="text-[hsl(var(--color-muted-foreground))]">Wunsch nicht gefunden</p>
	</div>
{:else}
	<div class="space-y-6">
		<!-- Back + Actions -->
		<div class="flex items-center justify-between">
			<button
				onclick={() => goto('/wishes')}
				class="flex items-center gap-1 text-sm text-[hsl(var(--color-muted-foreground))] hover:text-[hsl(var(--color-foreground))]"
			>
				<ArrowLeft size={16} />
				Zurück
			</button>
			<div class="flex gap-2">
				{#if wish.status === 'active'}
					<button
						onclick={handleFulfill}
						class="flex items-center gap-1.5 rounded-md bg-green-500/10 px-3 py-1.5 text-sm font-medium text-green-500 hover:bg-green-500/20"
					>
						<Check size={14} />
						Erfüllt
					</button>
				{/if}
				<button
					onclick={handleDelete}
					class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-[hsl(var(--color-muted-foreground))] hover:bg-red-500/10 hover:text-red-500"
				>
					<Trash size={14} />
				</button>
			</div>
		</div>

		<!-- Main content -->
		{#if editing}
			<div
				class="space-y-3 rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] p-4"
			>
				<input
					bind:value={editTitle}
					class="w-full rounded-md border border-[hsl(var(--color-border))] bg-transparent px-3 py-2 text-lg font-bold text-[hsl(var(--color-foreground))] outline-none focus:border-[hsl(var(--color-primary))]"
				/>
				<textarea
					bind:value={editDescription}
					placeholder="Beschreibung"
					rows="3"
					class="w-full resize-none rounded-md border border-[hsl(var(--color-border))] bg-transparent px-3 py-2 text-sm text-[hsl(var(--color-foreground))] outline-none placeholder:text-[hsl(var(--color-muted-foreground))] focus:border-[hsl(var(--color-primary))]"
				></textarea>
				<div class="flex gap-2">
					<input
						bind:value={editTargetPrice}
						placeholder="Zielpreis"
						type="number"
						step="0.01"
						class="w-32 rounded-md border border-[hsl(var(--color-border))] bg-transparent px-3 py-2 text-sm outline-none focus:border-[hsl(var(--color-primary))]"
					/>
					<input
						bind:value={editCategory}
						placeholder="Kategorie"
						class="w-40 rounded-md border border-[hsl(var(--color-border))] bg-transparent px-3 py-2 text-sm outline-none focus:border-[hsl(var(--color-primary))]"
					/>
				</div>
				<div class="flex justify-end gap-2">
					<button
						onclick={() => (editing = false)}
						class="rounded-md px-3 py-1.5 text-sm text-[hsl(var(--color-muted-foreground))] hover:bg-[hsl(var(--color-muted))]"
					>
						Abbrechen
					</button>
					<button
						onclick={saveEdit}
						class="rounded-md bg-[hsl(var(--color-primary))] px-4 py-1.5 text-sm font-medium text-[hsl(var(--color-primary-foreground))]"
					>
						Speichern
					</button>
				</div>
			</div>
		{:else}
			<button
				onclick={startEdit}
				class="w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] p-4 text-left transition-colors hover:border-[hsl(var(--color-primary)/0.3)]"
			>
				<div class="flex items-start justify-between">
					<div>
						<h1
							class="text-xl font-bold text-[hsl(var(--color-foreground))] {wish.status ===
							'fulfilled'
								? 'line-through opacity-60'
								: ''}"
						>
							{wish.title}
						</h1>
						{#if wish.description}
							<p class="mt-1 text-sm text-[hsl(var(--color-muted-foreground))]">
								{wish.description}
							</p>
						{/if}
					</div>
					{#if wish.status === 'fulfilled'}
						<span
							class="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500"
						>
							Erfüllt
						</span>
					{/if}
				</div>

				<div class="mt-3 flex flex-wrap gap-3 text-sm text-[hsl(var(--color-muted-foreground))]">
					<span class="flex items-center gap-1">
						<Star size={14} />
						{priorityLabel(wish.priority)}
					</span>
					{#if wish.targetPrice}
						<span>Zielpreis: {wish.targetPrice.toLocaleString('de-DE')} {wish.currency ?? '€'}</span
						>
					{/if}
					{#if wish.category}
						<span class="rounded bg-[hsl(var(--color-muted))] px-1.5 py-0.5 text-xs">
							{wish.category}
						</span>
					{/if}
					{#if lowestPrice != null && wish.targetPrice}
						<span
							class={lowestPrice <= wish.targetPrice
								? 'font-medium text-green-500'
								: 'text-orange-400'}
						>
							Bester Preis: {lowestPrice.toLocaleString('de-DE')} €
						</span>
					{/if}
				</div>
			</button>
		{/if}

		<!-- Product URLs -->
		<div
			class="rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] p-4"
		>
			<h2
				class="mb-3 flex items-center gap-2 text-sm font-semibold text-[hsl(var(--color-foreground))]"
			>
				<LinkIcon size={16} />
				Produkt-Links ({wish.productUrls.length})
			</h2>

			{#if wish.productUrls.length > 0}
				<ul class="mb-3 space-y-1.5">
					{#each wish.productUrls as url}
						<li class="flex items-center gap-2 text-sm">
							<a
								href={url}
								target="_blank"
								rel="noopener noreferrer"
								class="min-w-0 flex-1 truncate text-[hsl(var(--color-primary))] hover:underline"
							>
								{url}
							</a>
							<button
								onclick={() => removeUrl(url)}
								class="flex-shrink-0 rounded p-0.5 text-[hsl(var(--color-muted-foreground))] hover:text-red-500"
							>
								<X size={14} />
							</button>
						</li>
					{/each}
				</ul>
			{/if}

			<form
				onsubmit={(e) => {
					e.preventDefault();
					addUrl();
				}}
				class="flex gap-2"
			>
				<input
					bind:value={newUrl}
					placeholder="https://..."
					type="url"
					class="min-w-0 flex-1 rounded-md border border-[hsl(var(--color-border))] bg-transparent px-3 py-1.5 text-sm outline-none placeholder:text-[hsl(var(--color-muted-foreground))] focus:border-[hsl(var(--color-primary))]"
				/>
				<button
					type="submit"
					disabled={!newUrl.trim()}
					class="flex items-center gap-1 rounded-md bg-[hsl(var(--color-primary))] px-3 py-1.5 text-sm text-[hsl(var(--color-primary-foreground))] disabled:opacity-40"
				>
					<Plus size={14} />
				</button>
			</form>
		</div>

		<!-- Price History -->
		{#if priceChecks.value.length > 0}
			<div
				class="rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] p-4"
			>
				<h2 class="mb-3 text-sm font-semibold text-[hsl(var(--color-foreground))]">Preisverlauf</h2>
				<div class="space-y-1.5">
					{#each priceChecks.value.slice(0, 10) as check (check.id)}
						<div class="flex items-center justify-between text-sm">
							<span class="truncate text-[hsl(var(--color-muted-foreground))]">
								{formatDate(new Date(check.checkedAt))}
							</span>
							<span
								class="font-medium {check.available
									? 'text-[hsl(var(--color-foreground))]'
									: 'text-red-400 line-through'}"
							>
								{check.price.toLocaleString('de-DE')}
								{check.currency}
							</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Notes -->
		<div
			class="rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] p-4"
		>
			<h2 class="mb-3 text-sm font-semibold text-[hsl(var(--color-foreground))]">
				Notizen ({wish.notes.length})
			</h2>

			{#if wish.notes.length > 0}
				<ul class="mb-3 space-y-2">
					{#each wish.notes as note (note.id)}
						<li
							class="rounded-md bg-[hsl(var(--color-muted))] p-2.5 text-sm text-[hsl(var(--color-foreground))]"
						>
							<p>{note.content}</p>
							<p class="mt-1 text-[10px] text-[hsl(var(--color-muted-foreground))]">
								{formatDateTime(new Date(note.createdAt))}
							</p>
						</li>
					{/each}
				</ul>
			{/if}

			<form
				onsubmit={(e) => {
					e.preventDefault();
					addNote();
				}}
				class="flex gap-2"
			>
				<input
					bind:value={newNote}
					placeholder="Notiz hinzufügen..."
					class="min-w-0 flex-1 rounded-md border border-[hsl(var(--color-border))] bg-transparent px-3 py-1.5 text-sm outline-none placeholder:text-[hsl(var(--color-muted-foreground))] focus:border-[hsl(var(--color-primary))]"
				/>
				<button
					type="submit"
					disabled={!newNote.trim()}
					class="flex items-center gap-1 rounded-md bg-[hsl(var(--color-primary))] px-3 py-1.5 text-sm text-[hsl(var(--color-primary-foreground))] disabled:opacity-40"
				>
					<Plus size={14} />
				</button>
			</form>
		</div>

		<!-- Tags -->
		{#if wish.tags.length > 0}
			<div class="flex flex-wrap gap-1.5">
				{#each wish.tags as tag}
					<span
						class="rounded-full bg-[hsl(var(--color-muted))] px-2.5 py-1 text-xs text-[hsl(var(--color-muted-foreground))]"
					>
						{tag}
					</span>
				{/each}
			</div>
		{/if}
	</div>
{/if}
