<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type {
		ParsedContact,
		DuplicateInfo,
		DuplicateAction,
		ImportPreviewResponse,
	} from '$lib/api/import';

	interface Props {
		preview: ImportPreviewResponse;
		onImport: (duplicateAction: DuplicateAction, skipIndices: number[]) => void;
		onCancel: () => void;
		isImporting?: boolean;
	}

	let { preview, onImport, onCancel, isImporting = false }: Props = $props();

	let duplicateAction = $state<DuplicateAction>('skip');
	let selectedContacts = $state<Set<number>>(new Set(preview.contacts.map((_, i) => i)));

	// Create a lookup for duplicates by index
	const duplicatesByIndex = $derived(new Map(preview.duplicates.map((d) => [d.importIndex, d])));

	function toggleContact(index: number) {
		const newSet = new Set(selectedContacts);
		if (newSet.has(index)) {
			newSet.delete(index);
		} else {
			newSet.add(index);
		}
		selectedContacts = newSet;
	}

	function selectAll() {
		selectedContacts = new Set(preview.contacts.map((_, i) => i));
	}

	function deselectAll() {
		selectedContacts = new Set();
	}

	function handleImport() {
		const skipIndices = preview.contacts.map((_, i) => i).filter((i) => !selectedContacts.has(i));
		onImport(duplicateAction, skipIndices);
	}

	function getContactName(contact: ParsedContact): string {
		if (contact.displayName) return contact.displayName;
		if (contact.firstName || contact.lastName) {
			return [contact.firstName, contact.lastName].filter(Boolean).join(' ');
		}
		return contact.email || 'Unbekannt';
	}

	function getContactSubtitle(contact: ParsedContact): string {
		const parts: string[] = [];
		if (contact.email) parts.push(contact.email);
		if (contact.company) parts.push(contact.company);
		return parts.join(' • ') || '';
	}
</script>

<div class="space-y-6">
	<!-- Summary -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
		<div class="bg-card rounded-lg p-4 text-center">
			<div class="text-3xl font-bold text-foreground">{preview.totalParsed}</div>
			<div class="text-sm text-muted-foreground">{$_('import.preview.total')}</div>
		</div>
		<div class="bg-card rounded-lg p-4 text-center">
			<div class="text-3xl font-bold text-green-500">{preview.validCount}</div>
			<div class="text-sm text-muted-foreground">{$_('import.preview.valid')}</div>
		</div>
		<div class="bg-card rounded-lg p-4 text-center">
			<div class="text-3xl font-bold text-yellow-500">{preview.duplicates.length}</div>
			<div class="text-sm text-muted-foreground">{$_('import.preview.duplicates')}</div>
		</div>
		<div class="bg-card rounded-lg p-4 text-center">
			<div class="text-3xl font-bold text-primary">{selectedContacts.size}</div>
			<div class="text-sm text-muted-foreground">{$_('import.preview.selected')}</div>
		</div>
	</div>

	<!-- Errors -->
	{#if preview.errors.length > 0}
		<div class="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
			<h3 class="font-medium text-red-500 mb-2">{$_('import.preview.errors')}</h3>
			<ul class="text-sm text-red-400 space-y-1">
				{#each preview.errors as error}
					<li>{error}</li>
				{/each}
			</ul>
		</div>
	{/if}

	<!-- Duplicate handling -->
	{#if preview.duplicates.length > 0}
		<div class="bg-card rounded-lg p-4">
			<h3 class="font-medium text-foreground mb-3">{$_('import.preview.duplicateHandling')}</h3>
			<div class="flex flex-wrap gap-3">
				<label
					class="flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors
						{duplicateAction === 'skip' ? 'border-primary bg-primary/10' : 'border-border'}"
				>
					<input type="radio" bind:group={duplicateAction} value="skip" class="sr-only" />
					<span class="text-foreground">{$_('import.preview.skip')}</span>
				</label>
				<label
					class="flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors
						{duplicateAction === 'merge' ? 'border-primary bg-primary/10' : 'border-border'}"
				>
					<input type="radio" bind:group={duplicateAction} value="merge" class="sr-only" />
					<span class="text-foreground">{$_('import.preview.merge')}</span>
				</label>
				<label
					class="flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors
						{duplicateAction === 'create' ? 'border-primary bg-primary/10' : 'border-border'}"
				>
					<input type="radio" bind:group={duplicateAction} value="create" class="sr-only" />
					<span class="text-foreground">{$_('import.preview.create')}</span>
				</label>
			</div>
		</div>
	{/if}

	<!-- Contact list -->
	<div class="bg-card rounded-lg overflow-hidden">
		<div class="flex items-center justify-between p-4 border-b border-border">
			<h3 class="font-medium text-foreground">{$_('import.preview.contacts')}</h3>
			<div class="flex gap-2">
				<button type="button" onclick={selectAll} class="text-sm text-primary hover:underline">
					{$_('import.preview.selectAll')}
				</button>
				<span class="text-muted-foreground">|</span>
				<button type="button" onclick={deselectAll} class="text-sm text-primary hover:underline">
					{$_('import.preview.deselectAll')}
				</button>
			</div>
		</div>

		<div class="max-h-[400px] overflow-y-auto divide-y divide-border">
			{#each preview.contacts as contact, index}
				{@const duplicate = duplicatesByIndex.get(index)}
				{@const isSelected = selectedContacts.has(index)}

				<label
					class="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer transition-colors
						{!isSelected ? 'opacity-50' : ''}"
				>
					<input
						type="checkbox"
						checked={isSelected}
						onchange={() => toggleContact(index)}
						class="w-5 h-5 rounded border-border text-primary focus:ring-primary"
					/>

					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2">
							<span class="font-medium text-foreground truncate">
								{getContactName(contact)}
							</span>
							{#if duplicate}
								<span class="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500">
									{$_('import.preview.duplicateTag')}
								</span>
							{/if}
						</div>
						<div class="text-sm text-muted-foreground truncate">
							{getContactSubtitle(contact)}
						</div>
						{#if duplicate}
							<div class="text-xs text-yellow-500 mt-1">
								{$_('import.preview.matchesWith')} "{duplicate.existingContactName}" ({duplicate.matchField}:
								{duplicate.matchValue})
							</div>
						{/if}
					</div>
				</label>
			{/each}
		</div>
	</div>

	<!-- Actions -->
	<div class="flex justify-end gap-3">
		<button type="button" onclick={onCancel} class="btn btn-secondary" disabled={isImporting}>
			{$_('common.cancel')}
		</button>
		<button
			type="button"
			onclick={handleImport}
			class="btn btn-primary"
			disabled={isImporting || selectedContacts.size === 0}
		>
			{#if isImporting}
				<span class="inline-flex items-center gap-2">
					<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
					></span>
					{$_('import.importing')}
				</span>
			{:else}
				{$_('import.preview.importButton', { values: { count: selectedContacts.size } })}
			{/if}
		</button>
	</div>
</div>
