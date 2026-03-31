<script lang="ts">
	import ModelSelector from '$lib/components/settings/ModelSelector.svelte';
	import ParameterPanel from '$lib/components/settings/ParameterPanel.svelte';
	import SystemPromptEditor from '$lib/components/settings/SystemPromptEditor.svelte';
	import ModelComparisonSelector from '$lib/components/comparison/ModelComparisonSelector.svelte';
	import { chatStore } from '$lib/stores/chat.svelte';
	import { modelsStore } from '$lib/stores/models.svelte';
	import { Trash, Export } from '@manacore/shared-icons';

	function handleExport() {
		const data = chatStore.exportMessages();
		const blob = new Blob([data], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `chat-export-${new Date().toISOString().split('T')[0]}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function handleClear() {
		if (chatStore.messages.length === 0) return;
		if (confirm('Clear all messages?')) {
			chatStore.clearMessages();
		}
	}
</script>

<aside
	class="flex w-80 flex-col border-r"
	style="border-color: var(--color-border); background-color: var(--color-surface);"
>
	<div class="flex-1 overflow-y-auto p-4">
		<div class="space-y-6">
			<ModelSelector />
			<ParameterPanel />
			<SystemPromptEditor />
		</div>
	</div>

	<ModelComparisonSelector models={modelsStore.modelsWithModality} />

	<div class="border-t p-4" style="border-color: var(--color-border);">
		<div class="flex gap-2">
			<button
				onclick={handleClear}
				disabled={chatStore.messages.length === 0}
				class="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50"
				style="background-color: var(--color-bg);"
			>
				<Trash size={16} />
				Clear
			</button>
			<button
				onclick={handleExport}
				disabled={chatStore.messages.length === 0}
				class="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50"
				style="background-color: var(--color-bg);"
			>
				<Export size={16} />
				Export
			</button>
		</div>
	</div>
</aside>
