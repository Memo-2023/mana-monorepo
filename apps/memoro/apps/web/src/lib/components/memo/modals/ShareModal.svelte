<script lang="ts">
	import { Modal, Text } from '@manacore/shared-ui';
	import type { Memo } from '$lib/types/memo.types';

	interface Props {
		visible: boolean;
		memo: Memo;
		onClose: () => void;
	}

	let { visible, memo, onClose }: Props = $props();

	let copied = $state(false);
	let copiedContent = $state(false);
	let exportFormat = $state<'txt' | 'md'>('txt');

	const shareUrl = $derived(`${window.location.origin}/memos/${memo.id}`);

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(shareUrl);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}

	async function shareNative() {
		if (!navigator.share) {
			// Fallback to copy
			await copyLink();
			return;
		}

		try {
			await navigator.share({
				title: memo.title || 'Untitled Memo',
				text: memo.intro || memo.transcript?.substring(0, 100) || '',
				url: shareUrl,
			});
		} catch (err) {
			if ((err as Error).name !== 'AbortError') {
				console.error('Error sharing:', err);
			}
		}
	}

	function getFormattedContent() {
		return exportFormat === 'md'
			? `# ${memo.title || 'Untitled Memo'}

${memo.intro || ''}

**Datum:** ${new Date(memo.created_at).toLocaleDateString('de-DE')}
**Dauer:** ${formatDuration(memo.duration_millis)}

## Transkript

${memo.transcript || 'Kein Transkript verfügbar'}

${memo.memories && memo.memories.length > 0 ? `\n## KI-Analyse\n\n${memo.memories.map((m) => `### ${m.title}\n\n${m.content}`).join('\n\n')}` : ''}
`
			: `${memo.title || 'Untitled Memo'}

${memo.intro || ''}

Datum: ${new Date(memo.created_at).toLocaleDateString('de-DE')}
Dauer: ${formatDuration(memo.duration_millis)}

Transkript:
${memo.transcript || 'Kein Transkript verfügbar'}

${memo.memories && memo.memories.length > 0 ? `\nKI-Analyse:\n${memo.memories.map((m) => `${m.title}\n${m.content}`).join('\n\n')}` : ''}
`;
	}

	async function copyContent() {
		try {
			await navigator.clipboard.writeText(getFormattedContent());
			copiedContent = true;
			setTimeout(() => (copiedContent = false), 2000);
		} catch (err) {
			console.error('Failed to copy content:', err);
		}
	}

	function exportMemo() {
		const content = getFormattedContent();

		const blob = new Blob([content], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${memo.title || 'memo'}.${exportFormat}`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	function formatDuration(millis: number | null) {
		if (!millis) return '0:00';
		const seconds = Math.floor(millis / 1000);
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
	}
</script>

<Modal {visible} {onClose} title="Memo teilen" maxWidth="md">
	{#snippet children()}
		<div class="space-y-6">
			<!-- Share Link Section (hidden for now) -->
			<!--
			<div class="space-y-2">
				<label class="block text-sm font-medium text-theme">Link teilen</label>
				<div class="flex gap-2">
					<input
						type="text"
						readonly
						value={shareUrl}
						class="flex-1 rounded-lg border border-theme bg-content px-3 py-2 text-sm text-theme focus:outline-none"
					/>
					<button onclick={copyLink} class="btn-secondary flex items-center gap-2">
						{#if copied}
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								/>
							</svg>
							<span>Kopiert!</span>
						{:else}
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
								/>
							</svg>
							<span>Kopieren</span>
						{/if}
					</button>
				</div>
			</div>
			-->

			<!-- Native Share Button (hidden for now) -->
			<!--
			{#if navigator.share}
				<button onclick={shareNative} class="btn-primary w-full flex items-center justify-center gap-2">
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
						/>
					</svg>
					<span>Teilen via...</span>
				</button>
			{/if}
			-->

			<!-- Export Section -->
			<div class="space-y-3">
				<Text variant="small" weight="medium" class="block">Export-Format</Text>
				<div class="grid grid-cols-2 gap-3">
					<button
						onclick={() => (exportFormat = 'txt')}
						class="flex flex-col items-center gap-2 rounded-lg border-2 py-3 transition-all {exportFormat ===
						'txt'
							? 'border-primary bg-primary/10 text-primary'
							: 'border-theme text-theme hover:bg-menu-hover'}"
					>
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
						<Text variant="small" weight="medium">Text (.txt)</Text>
					</button>
					<button
						onclick={() => (exportFormat = 'md')}
						class="flex flex-col items-center gap-2 rounded-lg border-2 py-3 transition-all {exportFormat ===
						'md'
							? 'border-primary bg-primary/10 text-primary'
							: 'border-theme text-theme hover:bg-menu-hover'}"
					>
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
							/>
						</svg>
						<Text variant="small" weight="medium">Markdown (.md)</Text>
					</button>
				</div>

				<button
					onclick={copyContent}
					class="btn-secondary w-full flex items-center justify-center gap-2"
				>
					{#if copiedContent}
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						</svg>
						<Text variant="small">In Zwischenablage kopiert!</Text>
					{:else}
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
							/>
						</svg>
						<Text variant="small">In Zwischenablage kopieren</Text>
					{/if}
				</button>

				<button
					onclick={exportMemo}
					class="btn-primary w-full flex items-center justify-center gap-2"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
						/>
					</svg>
					<Text variant="small">Als {exportFormat.toUpperCase()} herunterladen</Text>
				</button>
			</div>
		</div>
	{/snippet}

	{#snippet footer()}
		<div class="flex justify-end">
			<button onclick={onClose} class="btn-secondary">Schließen</button>
		</div>
	{/snippet}
</Modal>
