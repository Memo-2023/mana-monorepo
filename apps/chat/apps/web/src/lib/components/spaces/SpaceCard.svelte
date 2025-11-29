<script lang="ts">
	import type { Space } from '@chat/types';
	import { UsersThree, DotsThreeVertical, Gear, Trash, SignOut } from '@manacore/shared-icons';

	interface Props {
		space: Space;
		isOwner: boolean;
		onSelect: (id: string) => void;
		onEdit: (id: string) => void;
		onDelete: (id: string) => void;
		onLeave: (id: string) => void;
	}

	let { space, isOwner, onSelect, onEdit, onDelete, onLeave }: Props = $props();
	let showMenu = $state(false);

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	}

	function handleMenuClick(e: MouseEvent) {
		e.stopPropagation();
		showMenu = !showMenu;
	}

	function handleAction(action: () => void) {
		showMenu = false;
		action();
	}
</script>

<svelte:window onclick={() => (showMenu = false)} />

<div
	class="group relative bg-surface rounded-xl border border-border
         shadow-sm hover:shadow-md transition-all cursor-pointer"
	onclick={() => onSelect(space.id)}
	onkeydown={(e) => e.key === 'Enter' && onSelect(space.id)}
	role="button"
	tabindex="0"
>
	<div class="p-4">
		<div class="flex items-start justify-between gap-3">
			<div class="flex-1 min-w-0">
				<div class="flex items-center gap-2 mb-1">
					<UsersThree size={20} weight="bold" class="text-primary flex-shrink-0" />
					<h3 class="text-base font-semibold text-foreground truncate">
						{space.name}
					</h3>
					{#if isOwner}
						<span
							class="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded"
						>
							Besitzer
						</span>
					{/if}
				</div>

				{#if space.description}
					<p class="text-sm text-muted-foreground line-clamp-2 mb-2">
						{space.description}
					</p>
				{/if}

				<p class="text-xs text-muted-foreground">
					Erstellt: {formatDate(space.createdAt)}
				</p>
			</div>

			<!-- Options Menu -->
			<div class="relative">
				<button
					onclick={handleMenuClick}
					class="p-2 text-muted-foreground hover:text-foreground
                 hover:bg-muted rounded-lg transition-colors"
					aria-label="Optionen"
				>
					<DotsThreeVertical size={20} weight="bold" />
				</button>

				{#if showMenu}
					<div
						class="absolute right-0 top-full mt-1 py-1 w-40 bg-surface rounded-lg shadow-lg
                   border border-border z-10"
						onclick={(e) => e.stopPropagation()}
						onkeydown={() => {}}
						role="menu"
						tabindex="-1"
					>
						{#if isOwner}
							<button
								onclick={() => handleAction(() => onEdit(space.id))}
								class="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground
                       hover:bg-muted"
								role="menuitem"
							>
								<Gear size={16} weight="bold" />
								Einstellungen
							</button>
							<button
								onclick={() => handleAction(() => onDelete(space.id))}
								class="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive
                       hover:bg-destructive/10"
								role="menuitem"
							>
								<Trash size={16} weight="bold" />
								Löschen
							</button>
						{:else}
							<button
								onclick={() => handleAction(() => onLeave(space.id))}
								class="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive
                       hover:bg-destructive/10"
								role="menuitem"
							>
								<SignOut size={16} weight="bold" />
								Verlassen
							</button>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
