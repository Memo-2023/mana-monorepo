<script lang="ts">
	import { FileText } from '@manacore/shared-icons';
	import { documentsStore } from '$lib/stores/documents.svelte';
	import type { Document } from '$lib/types';

	interface Props {
		value: string;
		placeholder?: string;
		onInput: (value: string) => void;
	}

	let { value, placeholder = '', onInput }: Props = $props();

	let textareaEl: HTMLTextAreaElement | undefined = $state();
	let showDropdown = $state(false);
	let mentionQuery = $state('');
	let mentionStartPos = $state(-1);
	let dropdownTop = $state(0);
	let dropdownLeft = $state(0);

	let filteredDocs = $derived(
		mentionQuery.trim()
			? documentsStore.documents
					.filter((d) => d.title.toLowerCase().includes(mentionQuery.toLowerCase()))
					.slice(0, 6)
			: []
	);

	function handleInput(e: Event) {
		const textarea = e.target as HTMLTextAreaElement;
		const newValue = textarea.value;
		const cursorPos = textarea.selectionStart;

		// Check if user just typed @
		const textBefore = newValue.substring(0, cursorPos);
		const lastAtIndex = textBefore.lastIndexOf('@');

		if (lastAtIndex >= 0) {
			const textAfterAt = textBefore.substring(lastAtIndex + 1);
			// Only show dropdown if @ is at start or after whitespace
			const charBefore = lastAtIndex > 0 ? newValue[lastAtIndex - 1] : ' ';
			if (charBefore === ' ' || charBefore === '\n' || lastAtIndex === 0) {
				// No spaces in the query (otherwise it's not a mention)
				if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
					mentionQuery = textAfterAt;
					mentionStartPos = lastAtIndex;
					showDropdown = true;
					updateDropdownPosition(textarea, cursorPos);
					onInput(newValue);
					return;
				}
			}
		}

		showDropdown = false;
		mentionQuery = '';
		onInput(newValue);
	}

	function updateDropdownPosition(textarea: HTMLTextAreaElement, cursorPos: number) {
		// Simple approximation based on character position
		const lineHeight = 20;
		const charWidth = 8;
		const text = textarea.value.substring(0, cursorPos);
		const lines = text.split('\n');
		const currentLine = lines.length - 1;
		const currentCol = lines[lines.length - 1].length;

		const rect = textarea.getBoundingClientRect();
		dropdownTop = Math.min(rect.height - 200, (currentLine + 1) * lineHeight + 8);
		dropdownLeft = Math.min(rect.width - 250, currentCol * charWidth);
	}

	function insertMention(doc: Document) {
		if (!textareaEl || mentionStartPos < 0) return;

		const before = value.substring(0, mentionStartPos);
		const after = value.substring(textareaEl.selectionStart);
		const mention = `@[${doc.title}](${doc.id})`;
		const newValue = before + mention + after;

		onInput(newValue);
		showDropdown = false;
		mentionQuery = '';
		mentionStartPos = -1;

		// Refocus and set cursor
		requestAnimationFrame(() => {
			if (textareaEl) {
				textareaEl.focus();
				const newPos = before.length + mention.length;
				textareaEl.setSelectionRange(newPos, newPos);
			}
		});
	}

	function handleKeydown(e: KeyboardEvent) {
		if (showDropdown && e.key === 'Escape') {
			e.preventDefault();
			showDropdown = false;
		}
	}
</script>

<div class="mention-input-wrapper relative">
	<textarea
		bind:this={textareaEl}
		{value}
		oninput={handleInput}
		onkeydown={handleKeydown}
		{placeholder}
		class="w-full h-full min-h-[400px] bg-transparent outline-none resize-none text-foreground placeholder:text-muted-foreground font-mono text-sm leading-relaxed"
	></textarea>

	{#if showDropdown && filteredDocs.length > 0}
		<div
			class="absolute bg-card border border-border rounded-lg shadow-xl z-20 w-64 max-h-48 overflow-y-auto"
			style="top: {dropdownTop}px; left: {dropdownLeft}px"
		>
			{#each filteredDocs as doc}
				<button
					class="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2 first:rounded-t-lg last:rounded-b-lg"
					onmousedown={(e) => {
						e.preventDefault();
						insertMention(doc);
					}}
				>
					<FileText size={14} class="text-muted-foreground shrink-0" />
					<span class="truncate text-foreground">{doc.title}</span>
					<span class="text-xs text-muted-foreground ml-auto shrink-0">{doc.type}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>
