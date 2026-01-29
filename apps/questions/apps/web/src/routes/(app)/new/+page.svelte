<script lang="ts">
	import { goto } from '$app/navigation';
	import { questionsStore, collectionsStore } from '$lib/stores';
	import { researchApi } from '$lib/api/research';
	import { ArrowLeft, Zap, Clock, Sparkles } from 'lucide-svelte';
	import type { ResearchDepth, QuestionPriority } from '$lib/types';

	let title = $state('');
	let description = $state('');
	let collectionId = $state<string | undefined>(collectionsStore.selectedId || undefined);
	let tags = $state<string[]>([]);
	let tagInput = $state('');
	let priority = $state<QuestionPriority>('normal');
	let researchDepth = $state<ResearchDepth>('standard');
	let startResearch = $state(true);

	let loading = $state(false);
	let error = $state<string | null>(null);

	const depthOptions: { value: ResearchDepth; label: string; description: string; icon: typeof Zap }[] = [
		{ value: 'quick', label: 'Quick', description: '5 sources, fast results', icon: Zap },
		{ value: 'standard', label: 'Standard', description: '15 sources, balanced', icon: Clock },
		{ value: 'deep', label: 'Deep', description: '30+ sources, comprehensive', icon: Sparkles },
	];

	function addTag() {
		const tag = tagInput.trim().toLowerCase();
		if (tag && !tags.includes(tag)) {
			tags = [...tags, tag];
		}
		tagInput = '';
	}

	function removeTag(tag: string) {
		tags = tags.filter((t) => t !== tag);
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (!title.trim()) {
			error = 'Please enter a question';
			return;
		}

		loading = true;
		error = null;

		const question = await questionsStore.create({
			title: title.trim(),
			description: description.trim() || undefined,
			collectionId,
			tags,
			priority,
			researchDepth,
		});

		if (question) {
			if (startResearch) {
				// Start research in the background
				researchApi.start({ questionId: question.id, depth: researchDepth }).catch(console.error);
			}
			goto(`/question/${question.id}`);
		} else {
			error = questionsStore.error || 'Failed to create question';
			loading = false;
		}
	}
</script>

<div class="mx-auto max-w-2xl p-6">
	<!-- Header -->
	<div class="mb-6">
		<a
			href="/"
			class="mb-4 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
		>
			<ArrowLeft class="h-4 w-4" />
			Back to questions
		</a>
		<h1 class="text-2xl font-bold text-foreground">Ask a Question</h1>
		<p class="mt-1 text-muted-foreground">
			Enter your question and let AI research it for you
		</p>
	</div>

	<form onsubmit={handleSubmit} class="space-y-6">
		{#if error}
			<div class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
				{error}
			</div>
		{/if}

		<!-- Question Title -->
		<div>
			<label for="title" class="mb-2 block font-medium text-foreground">Your Question</label>
			<input
				type="text"
				id="title"
				bind:value={title}
				placeholder="What would you like to know?"
				class="w-full rounded-lg border border-border bg-background px-4 py-3 text-lg text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
			/>
		</div>

		<!-- Description -->
		<div>
			<label for="description" class="mb-2 block font-medium text-foreground">
				Additional Context <span class="text-muted-foreground">(optional)</span>
			</label>
			<textarea
				id="description"
				bind:value={description}
				placeholder="Provide any additional details or context..."
				rows="3"
				class="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
			></textarea>
		</div>

		<!-- Collection -->
		<div>
			<label for="collection" class="mb-2 block font-medium text-foreground">Collection</label>
			<select
				id="collection"
				bind:value={collectionId}
				class="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
			>
				<option value={undefined}>No collection</option>
				{#each collectionsStore.collections as collection}
					<option value={collection.id}>{collection.name}</option>
				{/each}
			</select>
		</div>

		<!-- Tags -->
		<div>
			<label for="tags" class="mb-2 block font-medium text-foreground">Tags</label>
			<div class="flex flex-wrap gap-2 mb-2">
				{#each tags as tag}
					<span class="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm">
						{tag}
						<button
							type="button"
							onclick={() => removeTag(tag)}
							class="ml-1 text-muted-foreground hover:text-foreground"
						>
							×
						</button>
					</span>
				{/each}
			</div>
			<input
				type="text"
				id="tags"
				bind:value={tagInput}
				onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
				placeholder="Add a tag and press Enter"
				class="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
			/>
		</div>

		<!-- Research Depth -->
		<div>
			<label class="mb-2 block font-medium text-foreground">Research Depth</label>
			<div class="grid grid-cols-3 gap-3">
				{#each depthOptions as option}
					<button
						type="button"
						onclick={() => (researchDepth = option.value)}
						class="rounded-lg border-2 p-4 text-left transition-all {researchDepth === option.value
							? 'border-primary bg-primary/5'
							: 'border-border hover:border-primary/50'}"
					>
						<svelte:component this={option.icon} class="mb-2 h-5 w-5 text-primary" />
						<div class="font-medium text-foreground">{option.label}</div>
						<div class="mt-1 text-xs text-muted-foreground">{option.description}</div>
					</button>
				{/each}
			</div>
		</div>

		<!-- Start Research Toggle -->
		<div class="flex items-center gap-3">
			<input
				type="checkbox"
				id="startResearch"
				bind:checked={startResearch}
				class="h-5 w-5 rounded border-border text-primary focus:ring-primary"
			/>
			<label for="startResearch" class="text-foreground">
				Start research immediately after creating
			</label>
		</div>

		<!-- Submit -->
		<div class="flex gap-3">
			<a
				href="/"
				class="flex-1 rounded-lg border border-border px-4 py-3 text-center font-medium text-foreground hover:bg-secondary"
			>
				Cancel
			</a>
			<button
				type="submit"
				disabled={loading || !title.trim()}
				class="flex-1 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
			>
				{loading ? 'Creating...' : 'Ask Question'}
			</button>
		</div>
	</form>
</div>
