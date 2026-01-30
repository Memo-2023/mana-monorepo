<script lang="ts">
	import Header from '$lib/components/layout/Header.svelte';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import MessageList from '$lib/components/chat/MessageList.svelte';
	import ChatInput from '$lib/components/chat/ChatInput.svelte';
</script>

<svelte:head>
	<title>LLM Playground | mana-llm</title>
</svelte:head>

<Header />

<div class="flex flex-1 overflow-hidden">
	<Sidebar />

	<main class="flex flex-1 flex-col" style="background-color: var(--color-bg);">
		<MessageList />
		<ChatInput />
	</main>
</div>
