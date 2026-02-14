<script lang="ts">
	import { UploadSimple } from '@manacore/shared-icons';

	interface Props {
		visible: boolean;
	}

	let { visible }: Props = $props();
</script>

{#if visible}
	<div
		class="fixed inset-0 z-50 bg-primary/10 backdrop-blur-sm flex items-center justify-center pointer-events-none"
	>
		<div
			class="bg-white dark:bg-zinc-800 rounded-2xl p-8 shadow-2xl border-2 border-dashed border-primary flex flex-col items-center gap-4"
		>
			<div class="p-4 rounded-full bg-primary/10">
				<UploadSimple class="h-12 w-12 text-primary" />
			</div>
			<div class="text-center">
				<p class="text-lg font-semibold text-foreground">Datei hier ablegen</p>
				<p class="text-sm text-muted-foreground mt-1">Bilder, Videos oder Dateien</p>
			</div>
		</div>
	</div>
{/if}
