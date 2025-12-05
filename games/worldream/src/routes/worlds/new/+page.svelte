<script lang="ts">
	import { goto } from '$app/navigation';
	import NodeForm from '$lib/components/forms/NodeForm.svelte';
	import type { ContentNode } from '$lib/types/content';

	let { data } = $props();

	if (!data.user) {
		goto('/auth/login');
	}

	async function handleSubmit(createdNode: ContentNode) {
		goto(`/worlds/${createdNode.slug}`);
	}

	function handleCancel() {
		goto('/worlds');
	}
</script>

<div class="min-h-screen bg-theme-background">
	<!-- Header Section with Gradient -->
	<div
		class="relative overflow-hidden bg-gradient-to-br from-theme-primary-500/10 via-theme-primary-600/5 to-transparent pb-8 pt-12"
	>
		<!-- Animated Background Elements -->
		<div class="absolute inset-0 overflow-hidden">
			<div
				class="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-theme-primary-400/10 blur-3xl"
			></div>
			<div
				class="absolute -right-40 -bottom-40 h-80 w-80 rounded-full bg-theme-primary-600/10 blur-3xl"
			></div>
		</div>

		<!-- Content -->
		<div class="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
			<div class="text-center">
				<h1 class="text-4xl font-bold tracking-tight text-theme-text-primary sm:text-5xl">
					Neue Welt erschaffen
				</h1>
				<p class="mt-4 text-lg text-theme-text-secondary">
					Erschaffe deine eigene einzigartige Welt mit Charakteren, Orten und Geschichten
				</p>
			</div>
		</div>
	</div>

	<!-- Form Section -->
	<div class="mx-auto max-w-4xl px-4 pb-12 sm:px-6 lg:px-8">
		<div
			class="relative -mt-4 rounded-2xl border border-theme-border-subtle bg-theme-surface shadow-xl"
		>
			<NodeForm mode="create" kind="world" onSubmit={handleSubmit} onCancel={handleCancel} />
		</div>
	</div>
</div>

<style>
	:global(body) {
		background-color: var(--theme-background);
	}
</style>
