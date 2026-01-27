<script lang="ts">
	interface Props {
		currentIndex: number;
		totalModels: number;
		currentModelName: string;
		progress: number;
		onCancel: () => void;
	}

	let { currentIndex, totalModels, currentModelName, progress, onCancel }: Props = $props();
</script>

<div class="rounded-xl border border-border bg-card p-4 shadow-sm">
	<!-- Status Text -->
	<div class="flex items-center justify-between mb-3">
		<p class="text-sm text-foreground">
			Verarbeite Modell <span class="font-medium">{currentIndex + 1}</span> von
			<span class="font-medium">{totalModels}</span>:
			<span class="text-primary font-medium">{currentModelName}</span>
		</p>
		<button
			onclick={onCancel}
			class="px-3 py-1 text-sm rounded-lg border border-border
				   text-muted-foreground hover:text-foreground hover:bg-muted
				   transition-colors"
		>
			Abbrechen
		</button>
	</div>

	<!-- Progress Bar -->
	<div class="relative h-2 bg-muted rounded-full overflow-hidden">
		<div
			class="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-300"
			style="width: {progress}%"
		></div>
	</div>

	<!-- Percentage -->
	<p class="text-xs text-muted-foreground mt-2 text-right">
		{Math.round(progress)}%
	</p>
</div>
