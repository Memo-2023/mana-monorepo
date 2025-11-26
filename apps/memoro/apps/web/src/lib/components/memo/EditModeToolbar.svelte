<script lang="ts">
	interface Props {
		onSave: () => void;
		onCancel: () => void;
		isSaving?: boolean;
	}

	let { onSave, onCancel, isSaving = false }: Props = $props();
</script>

<div class="sticky bottom-0 left-0 right-0 border-t border-theme bg-menu p-4 z-10">
	<div class="flex items-center justify-end gap-3">
		<button
			onclick={onCancel}
			disabled={isSaving}
			class="btn-secondary"
		>
			<svg
				class="h-4 w-4"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M6 18L18 6M6 6l12 12"
				/>
			</svg>
			<span>Cancel</span>
		</button>

		<button
			onclick={onSave}
			disabled={isSaving}
			class="btn-primary"
		>
			{#if isSaving}
				<svg
					class="h-4 w-4 animate-spin"
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
				<span>Saving...</span>
			{:else}
				<svg
					class="h-4 w-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5 13l4 4L19 7"
					/>
				</svg>
				<span>Save Changes</span>
			{/if}
		</button>
	</div>
</div>
