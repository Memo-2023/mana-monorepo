<script lang="ts">
	import { toast, type Toast } from '$lib/stores/toast';

	let toasts: Toast[] = [];

	toast.subscribe((value) => {
		toasts = value;
	});

	function getToastClasses(type: Toast['type']) {
		switch (type) {
			case 'success':
				return 'bg-green-500 text-white';
			case 'error':
				return 'bg-red-500 text-white';
			case 'warning':
				return 'bg-yellow-500 text-black';
			default:
				return 'bg-blue-500 text-white';
		}
	}

	function getIcon(type: Toast['type']) {
		switch (type) {
			case 'success':
				return '✓';
			case 'error':
				return '✕';
			case 'warning':
				return '⚠';
			default:
				return 'ℹ';
		}
	}
</script>

<div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
	{#each toasts as t (t.id)}
		<div
			class="flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg transition-all duration-300 {getToastClasses(
				t.type
			)}"
		>
			<span class="text-lg">{getIcon(t.type)}</span>
			<span class="flex-1">{t.message}</span>
			<button onclick={() => toast.remove(t.id)} class="ml-2 opacity-70 hover:opacity-100">
				✕
			</button>
		</div>
	{/each}
</div>
