<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';

	interface Space {
		id: string;
		name: string;
		description?: string;
		member_count: number;
		color?: string;
		icon?: string;
	}

	interface Props {
		visible: boolean;
		spaces: Space[];
		selectedSpaceIds: string[];
		onClose: () => void;
		onSpaceToggle: (spaceId: string) => void;
		onCreate?: () => void;
		isLoading?: boolean;
	}

	let {
		visible,
		spaces,
		selectedSpaceIds,
		onClose,
		onSpaceToggle,
		onCreate,
		isLoading = false,
	}: Props = $props();

	let searchQuery = $state('');

	const filteredSpaces = $derived(
		spaces.filter((space) => space.name.toLowerCase().includes(searchQuery.toLowerCase()))
	);

	function getSpaceColor(color?: string): string {
		if (!color) return 'bg-primary';
		return color;
	}

	function getSpaceIcon(icon?: string): string {
		return icon || '📁';
	}
</script>

<Modal {visible} {onClose} title="Manage Spaces" maxWidth="lg">
	{#snippet children()}
		<div class="space-y-4">
			<!-- Description -->
			<p class="text-sm text-theme-secondary">
				Choose which spaces this memo belongs to. Spaces help organize and share memos with your
				team.
			</p>

			<!-- Search -->
			<div class="relative">
				<svg
					class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-theme-secondary"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search spaces..."
					class="w-full rounded-lg border border-theme bg-content py-2 pl-10 pr-4 text-theme placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-primary"
				/>
			</div>

			<!-- Spaces List -->
			<div class="max-h-96 space-y-2 overflow-y-auto">
				{#if isLoading}
					<div class="flex items-center justify-center py-8">
						<svg
							class="h-8 w-8 animate-spin text-primary"
							fill="none"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
						>
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							/>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							/>
						</svg>
					</div>
				{:else if filteredSpaces.length > 0}
					{#each filteredSpaces as space (space.id)}
						<button
							onclick={() => onSpaceToggle(space.id)}
							class="flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left transition-all {selectedSpaceIds.includes(
								space.id
							)
								? 'border-primary bg-primary/10'
								: 'border-theme hover:bg-menu-hover'}"
						>
							<!-- Icon/Avatar -->
							<div
								class="{getSpaceColor(
									space.color
								)} flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-white"
							>
								<span class="text-xl">{getSpaceIcon(space.icon)}</span>
							</div>

							<!-- Content -->
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2">
									<h4 class="font-semibold text-theme truncate">{space.name}</h4>
									{#if selectedSpaceIds.includes(space.id)}
										<svg
											class="h-5 w-5 flex-shrink-0 text-primary"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<path
												fill-rule="evenodd"
												d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
												clip-rule="evenodd"
											/>
										</svg>
									{/if}
								</div>
								{#if space.description}
									<p class="text-xs text-theme-secondary line-clamp-1">{space.description}</p>
								{/if}
								<div class="mt-1 flex items-center gap-1 text-xs text-theme-muted">
									<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
										/>
									</svg>
									<span>{space.member_count} {space.member_count === 1 ? 'member' : 'members'}</span
									>
								</div>
							</div>
						</button>
					{/each}
				{:else if searchQuery}
					<!-- No Search Results -->
					<div class="rounded-lg bg-content p-8 text-center">
						<svg
							class="mx-auto mb-3 h-12 w-12 text-theme-secondary"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							/>
						</svg>
						<p class="text-theme-secondary">No spaces found for "{searchQuery}"</p>
					</div>
				{:else}
					<!-- Empty State -->
					<div class="rounded-lg bg-content p-8 text-center">
						<svg
							class="mx-auto mb-3 h-12 w-12 text-theme-secondary"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
							/>
						</svg>
						<p class="mb-2 text-theme-secondary">No spaces available</p>
						{#if onCreate}
							<button onclick={onCreate} class="btn-primary text-sm">Create your first space</button
							>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Create New Space -->
			{#if onCreate && filteredSpaces.length > 0}
				<div class="border-t border-theme pt-4">
					<button
						onclick={onCreate}
						class="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-theme p-3 text-theme transition-colors hover:bg-menu-hover"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4v16m8-8H4"
							/>
						</svg>
						<span class="font-medium">Create New Space</span>
					</button>
				</div>
			{/if}

			<!-- Info -->
			<div class="rounded-lg bg-blue-500/10 border border-blue-500/30 p-3">
				<div class="flex items-start gap-2">
					<svg
						class="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-500"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<div class="flex-1">
						<p class="text-sm font-medium text-blue-800 dark:text-blue-200">About Spaces</p>
						<p class="text-xs text-blue-700 dark:text-blue-300 mt-1">
							Spaces allow you to organize memos and collaborate with team members. A memo can
							belong to multiple spaces.
						</p>
					</div>
				</div>
			</div>
		</div>
	{/snippet}

	{#snippet footer()}
		<div class="flex justify-end">
			<button onclick={onClose} class="btn-primary">Done</button>
		</div>
	{/snippet}
</Modal>
