<script lang="ts">
	import type { Template } from '@chat/types';
	import { Star, PencilSimple, Trash } from '@manacore/shared-icons';

	interface Props {
		template: Template;
		onUse: (id: string) => void;
		onEdit: (id: string) => void;
		onDelete: (id: string) => void;
		onSetDefault: (id: string) => void;
	}

	let { template, onUse, onEdit, onDelete, onSetDefault }: Props = $props();

	function truncatePrompt(text: string, maxLength: number = 80): string {
		if (text.length <= maxLength) return text;
		return text.substring(0, maxLength - 3) + '...';
	}
</script>

<div
	class="group relative flex rounded-xl overflow-hidden bg-surface shadow-sm hover:shadow-md transition-all
         {template.is_default
		? 'ring-2 ring-primary'
		: 'border border-border'}"
>
	<!-- Color Indicator -->
	<div class="w-2 flex-shrink-0" style="background-color: {template.color}"></div>

	<!-- Content -->
	<div class="flex-1 p-4">
		<div class="flex items-start justify-between gap-3">
			<div class="flex-1 min-w-0">
				<div class="flex items-center gap-2 mb-1">
					<h3 class="text-base font-semibold text-foreground truncate">
						{template.name}
					</h3>
					{#if template.is_default}
						<span class="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded">
							Standard
						</span>
					{/if}
				</div>

				{#if template.description}
					<p class="text-sm text-muted-foreground line-clamp-2 mb-2">
						{template.description}
					</p>
				{/if}

				<p class="text-xs text-muted-foreground italic line-clamp-2">
					{truncatePrompt(template.system_prompt)}
				</p>
			</div>

			<!-- Actions -->
			<div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
				{#if !template.is_default}
					<button
						onclick={() => onSetDefault(template.id)}
						class="p-1.5 text-muted-foreground hover:text-yellow-500 hover:bg-muted rounded-lg transition-colors"
						title="Als Standard setzen"
						aria-label="Als Standard setzen"
					>
						<Star size={16} weight="bold" />
					</button>
				{/if}
				<button
					onclick={() => onEdit(template.id)}
					class="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
					title="Bearbeiten"
					aria-label="Bearbeiten"
				>
					<PencilSimple size={16} weight="bold" />
				</button>
				<button
					onclick={() => onDelete(template.id)}
					class="p-1.5 text-muted-foreground hover:text-destructive hover:bg-muted rounded-lg transition-colors"
					title="Löschen"
					aria-label="Löschen"
				>
					<Trash size={16} weight="bold" />
				</button>
			</div>
		</div>

		<!-- Use Button -->
		<button
			onclick={() => onUse(template.id)}
			class="mt-3 w-full py-2 px-3 text-sm font-medium text-white rounded-lg transition-colors"
			style="background-color: {template.color}"
		>
			Chat starten
		</button>
	</div>
</div>
