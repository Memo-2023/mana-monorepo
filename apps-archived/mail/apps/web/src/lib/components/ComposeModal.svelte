<script lang="ts">
	import { composeStore } from '$lib/stores/compose.svelte';
	import type { EmailAddress } from '$lib/api/emails';

	let toInput = $state('');
	let ccInput = $state('');
	let bccInput = $state('');
	let showCc = $state(false);
	let showBcc = $state(false);

	function parseEmailInput(input: string): EmailAddress[] {
		if (!input.trim()) return [];
		return input.split(',').map((email) => {
			const trimmed = email.trim();
			const match = trimmed.match(/^(?:"?([^"<]*)"?\s*)?<?([^>]+)>?$/);
			if (match) {
				return {
					email: match[2] || trimmed,
					name: match[1]?.trim() || undefined,
				};
			}
			return { email: trimmed };
		});
	}

	function formatAddresses(addresses: EmailAddress[]): string {
		return addresses.map((a) => (a.name ? `${a.name} <${a.email}>` : a.email)).join(', ');
	}

	// Initialize inputs from form
	$effect(() => {
		toInput = formatAddresses(composeStore.composeForm.toAddresses);
		ccInput = formatAddresses(composeStore.composeForm.ccAddresses);
		bccInput = formatAddresses(composeStore.composeForm.bccAddresses);
		showCc = composeStore.composeForm.ccAddresses.length > 0;
		showBcc = composeStore.composeForm.bccAddresses.length > 0;
	});

	function handleToChange() {
		composeStore.updateForm({ toAddresses: parseEmailInput(toInput) });
	}

	function handleCcChange() {
		composeStore.updateForm({ ccAddresses: parseEmailInput(ccInput) });
	}

	function handleBccChange() {
		composeStore.updateForm({ bccAddresses: parseEmailInput(bccInput) });
	}

	function handleSubjectChange(event: Event) {
		const input = event.target as HTMLInputElement;
		composeStore.updateForm({ subject: input.value });
	}

	function handleBodyChange(event: Event) {
		const textarea = event.target as HTMLTextAreaElement;
		composeStore.updateForm({ bodyHtml: textarea.value });
	}

	async function handleSend() {
		const success = await composeStore.send();
		if (success) {
			// Success message would be shown via toast
		}
	}

	async function handleSaveDraft() {
		await composeStore.saveDraft();
	}

	function handleClose() {
		composeStore.closeCompose();
	}

	function handleDiscard() {
		if (composeStore.currentDraft) {
			composeStore.deleteDraft(composeStore.currentDraft.id);
		}
		composeStore.closeCompose();
	}
</script>

<!-- Backdrop -->
<div
	class="fixed inset-0 bg-black/50 z-40"
	onclick={handleClose}
	role="button"
	tabindex="-1"
	onkeydown={(e) => e.key === 'Escape' && handleClose()}
></div>

<!-- Modal -->
<div
	class="fixed bottom-4 right-4 w-[600px] max-h-[80vh] bg-surface rounded-xl shadow-2xl z-50 flex flex-col border border-border"
>
	<!-- Header -->
	<div
		class="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 rounded-t-xl"
	>
		<h3 class="font-semibold">
			{composeStore.composeForm.replyType === 'reply'
				? 'Reply'
				: composeStore.composeForm.replyType === 'reply-all'
					? 'Reply All'
					: composeStore.composeForm.replyType === 'forward'
						? 'Forward'
						: 'New Message'}
		</h3>
		<div class="flex items-center gap-2">
			<button class="btn btn-ghost btn-icon" onclick={handleClose} title="Minimize"> — </button>
			<button class="btn btn-ghost btn-icon" onclick={handleClose} title="Close"> ✕ </button>
		</div>
	</div>

	<!-- Form -->
	<div class="flex-1 overflow-y-auto">
		<!-- To -->
		<div class="px-4 py-2 border-b border-border flex items-center gap-2">
			<label class="text-sm text-muted-foreground w-12">To:</label>
			<input
				type="text"
				class="flex-1 bg-transparent border-none outline-none text-sm"
				bind:value={toInput}
				onblur={handleToChange}
				placeholder="Recipients"
			/>
			<div class="flex gap-1">
				{#if !showCc}
					<button
						class="text-xs text-muted-foreground hover:text-foreground"
						onclick={() => (showCc = true)}
					>
						Cc
					</button>
				{/if}
				{#if !showBcc}
					<button
						class="text-xs text-muted-foreground hover:text-foreground"
						onclick={() => (showBcc = true)}
					>
						Bcc
					</button>
				{/if}
			</div>
		</div>

		<!-- Cc -->
		{#if showCc}
			<div class="px-4 py-2 border-b border-border flex items-center gap-2">
				<label class="text-sm text-muted-foreground w-12">Cc:</label>
				<input
					type="text"
					class="flex-1 bg-transparent border-none outline-none text-sm"
					bind:value={ccInput}
					onblur={handleCcChange}
					placeholder="Cc recipients"
				/>
			</div>
		{/if}

		<!-- Bcc -->
		{#if showBcc}
			<div class="px-4 py-2 border-b border-border flex items-center gap-2">
				<label class="text-sm text-muted-foreground w-12">Bcc:</label>
				<input
					type="text"
					class="flex-1 bg-transparent border-none outline-none text-sm"
					bind:value={bccInput}
					onblur={handleBccChange}
					placeholder="Bcc recipients"
				/>
			</div>
		{/if}

		<!-- Subject -->
		<div class="px-4 py-2 border-b border-border">
			<input
				type="text"
				class="w-full bg-transparent border-none outline-none text-sm"
				value={composeStore.composeForm.subject}
				oninput={handleSubjectChange}
				placeholder="Subject"
			/>
		</div>

		<!-- Body -->
		<div class="p-4">
			<textarea
				class="w-full h-64 bg-transparent border-none outline-none text-sm resize-none"
				value={composeStore.composeForm.bodyHtml}
				oninput={handleBodyChange}
				placeholder="Write your message..."
			></textarea>
		</div>
	</div>

	<!-- Footer -->
	<div
		class="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30 rounded-b-xl"
	>
		<div class="flex items-center gap-2">
			<button class="btn btn-primary" onclick={handleSend} disabled={composeStore.sending}>
				{composeStore.sending ? 'Sending...' : 'Send'}
			</button>
			<button class="btn btn-ghost" title="Formatting"> A </button>
			<button class="btn btn-ghost" title="Attach file"> 📎 </button>
		</div>
		<div class="flex items-center gap-2">
			<button
				class="btn btn-ghost btn-sm"
				onclick={handleSaveDraft}
				disabled={composeStore.loading}
			>
				{composeStore.loading ? 'Saving...' : 'Save Draft'}
			</button>
			<button class="btn btn-ghost btn-sm text-destructive" onclick={handleDiscard}> 🗑️ </button>
		</div>
	</div>

	<!-- Error Message -->
	{#if composeStore.error}
		<div
			class="absolute bottom-16 left-4 right-4 bg-destructive/10 text-destructive text-sm p-2 rounded-md"
		>
			{composeStore.error}
		</div>
	{/if}
</div>
