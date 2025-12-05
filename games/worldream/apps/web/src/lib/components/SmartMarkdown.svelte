<script lang="ts">
	import { renderMarkdownSmart, renderMarkdown } from '$lib/utils/markdown';
	import { onMount } from 'svelte';

	interface Props {
		text: string;
		class?: string;
		immediateRender?: boolean; // Sofort mit Fallback rendern
		references?: string; // Optional references field from story
	}

	let { text, class: className = '', immediateRender = true, references }: Props = $props();

	let renderedHtml = $state('');
	let loading = $state(true);

	async function renderContent() {
		if (!text) {
			renderedHtml = '';
			loading = false;
			return;
		}

		console.log('📖 SmartMarkdown: Rendering text:', text.substring(0, 300));
		if (references) {
			console.log('📚 Story references field:', references);
		}

		// Parse references to extract slugs
		let context: any = undefined;
		if (references && /REF_\d+/.test(text)) {
			// Extract character and place slugs from references field
			const lines = references.split('\n');
			const characters: { slug: string }[] = [];
			let place: { slug: string } | undefined;

			lines.forEach((line) => {
				if (line.startsWith('cast:')) {
					// Extract character slugs: "cast: @finn-zahnrad, @zahnkiel"
					const matches = line.matchAll(/@([\w-]+)/g);
					for (const match of matches) {
						characters.push({ slug: match[1] });
					}
				} else if (line.startsWith('places:')) {
					// Extract place slug: "places: @kupferloge"
					const match = line.match(/@([\w-]+)/);
					if (match) {
						place = { slug: match[1] };
					}
				}
			});

			if (characters.length > 0 || place) {
				context = { characters, place };
				console.log('📝 Extracted context for REF replacement:', context);
			}
		}

		// Immediate render with formatted slugs if requested
		if (immediateRender) {
			const immediateHtml = renderMarkdown(text);
			console.log('⚡ Immediate render result:', immediateHtml.substring(0, 300));
			renderedHtml = immediateHtml;
		}

		// Then fetch real names and update
		try {
			const smartHtml = await renderMarkdownSmart(text, context);
			console.log('✨ Smart render result:', smartHtml.substring(0, 300));
			renderedHtml = smartHtml;
		} catch (error) {
			console.error('Failed to render with smart display:', error);
			// Keep the immediate render as fallback
			if (!immediateRender) {
				renderedHtml = renderMarkdown(text);
			}
		} finally {
			loading = false;
		}
	}

	// Re-render when text changes
	$effect(() => {
		loading = true;
		renderContent();
	});
</script>

<div class="smart-markdown {className}">
	{#if loading && !immediateRender}
		<div class="animate-pulse">
			<div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
			<div class="h-4 bg-gray-200 rounded w-1/2"></div>
		</div>
	{:else}
		{@html renderedHtml}
	{/if}
</div>

<style>
	:global(.smart-markdown p) {
		margin-bottom: 1rem;
	}

	:global(.smart-markdown h2) {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 0.75rem;
		margin-top: 1.5rem;
	}

	:global(.smart-markdown h3) {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		margin-top: 1rem;
	}

	:global(.smart-markdown ul, .smart-markdown ol) {
		margin-left: 1.5rem;
		margin-bottom: 1rem;
	}

	:global(.smart-markdown li) {
		margin-bottom: 0.25rem;
	}

	:global(.smart-markdown blockquote) {
		border-left: 4px solid #e5e7eb;
		padding-left: 1rem;
		margin: 1rem 0;
		font-style: italic;
	}

	:global(.smart-markdown code) {
		background-color: #f3f4f6;
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
		font-size: 0.875rem;
	}

	:global(.smart-markdown pre) {
		background-color: #1f2937;
		color: #f3f4f6;
		padding: 1rem;
		border-radius: 0.5rem;
		overflow-x: auto;
		margin-bottom: 1rem;
	}

	:global(.smart-markdown a[data-kind='character']) {
		border-bottom: 2px dotted currentColor;
		text-decoration: none;
	}

	:global(.smart-markdown a[data-kind='place']) {
		border-bottom: 1px dashed currentColor;
		text-decoration: none;
	}

	:global(.smart-markdown a[data-kind='object']) {
		border-bottom: 1px solid currentColor;
		text-decoration: none;
		opacity: 0.9;
	}
</style>
