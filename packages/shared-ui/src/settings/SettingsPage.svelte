<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	interface TocItem {
		id: string;
		title: string;
		icon?: string;
	}

	interface Props {
		/** Page title */
		title: string;
		/** Optional subtitle/description */
		subtitle?: string;
		/** Maximum width of the content */
		maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
		/** Additional CSS classes */
		class?: string;
		/** Main content */
		children: Snippet;
	}

	let { title, subtitle, maxWidth = 'md', class: className = '', children }: Props = $props();

	const maxWidthClasses = {
		sm: 'max-w-lg',
		md: 'max-w-2xl',
		lg: 'max-w-3xl',
		xl: 'max-w-4xl',
	};

	let tocItems = $state<TocItem[]>([]);
	let activeSection = $state<string>('');
	let contentEl: HTMLElement;

	onMount(() => {
		// Collect all section headers
		const sections = contentEl.querySelectorAll('[data-settings-section]');
		const items: TocItem[] = [];

		sections.forEach((section, index) => {
			const id = section.getAttribute('data-settings-section') || `section-${index}`;
			const titleEl = section.querySelector('.section-title');
			const title = titleEl?.textContent || `Section ${index + 1}`;
			items.push({ id, title });
		});

		tocItems = items;

		// Find the currently active section based on scroll position
		function updateActiveSection() {
			const scrollPosition = window.scrollY + window.innerHeight;
			const pageHeight = document.documentElement.scrollHeight;
			const bottomThreshold = 50;

			// If at bottom of page, activate last section
			if (pageHeight - scrollPosition <= bottomThreshold && tocItems.length > 0) {
				activeSection = tocItems[tocItems.length - 1].id;
				return;
			}

			// Find which section is currently in view
			const viewportTop = window.scrollY + 120; // Account for sticky header offset

			let currentSection = '';
			sections.forEach((section) => {
				const rect = section.getBoundingClientRect();
				const sectionTop = rect.top + window.scrollY;

				// Section is active if its top is above our viewport check point
				if (sectionTop <= viewportTop) {
					const id = section.getAttribute('data-settings-section');
					if (id) currentSection = id;
				}
			});

			if (currentSection) {
				activeSection = currentSection;
			} else if (tocItems.length > 0) {
				// Default to first section if nothing else matches
				activeSection = tocItems[0].id;
			}
		}

		// Initial check
		updateActiveSection();

		// Update on scroll
		window.addEventListener('scroll', updateActiveSection, { passive: true });

		return () => {
			window.removeEventListener('scroll', updateActiveSection);
		};
	});

	function scrollToSection(id: string) {
		const section = contentEl.querySelector(`[data-settings-section="${id}"]`);
		if (section) {
			const y = section.getBoundingClientRect().top + window.scrollY - 100;
			window.scrollTo({ top: y, behavior: 'smooth' });
		}
	}
</script>

<div class="settings-page bg-background {className}">
	<!-- Table of Contents - Desktop only -->
	<aside class="toc-sidebar">
		<div class="toc-container">
			<p class="toc-title">Inhalt</p>
			<nav class="toc-nav">
				{#each tocItems as item}
					<button
						class="toc-item"
						class:active={activeSection === item.id}
						onclick={() => scrollToSection(item.id)}
					>
						{item.title}
					</button>
				{/each}
			</nav>
		</div>
	</aside>

	<!-- Main Content -->
	<main class="settings-main">
		<div class="settings-content {maxWidthClasses[maxWidth]}">
			<header class="settings-header">
				<h1 class="text-2xl sm:text-[1.75rem] font-bold text-foreground m-0">{title}</h1>
				{#if subtitle}
					<p class="text-sm text-muted-foreground mt-1">{subtitle}</p>
				{/if}
			</header>

			<div class="sections-container" bind:this={contentEl}>
				{@render children()}
			</div>
		</div>
	</main>
</div>

<style>
	.settings-page {
		min-height: calc(100vh - 4rem);
		position: relative;
	}

	/* Table of Contents Sidebar - Fixed position on the left */
	.toc-sidebar {
		display: none;
	}

	@media (min-width: 1400px) {
		.toc-sidebar {
			display: block;
			position: fixed;
			left: 2rem;
			top: 100px;
			width: 240px;
			max-height: calc(100vh - 140px);
			overflow-y: auto;
			z-index: 10;
		}
	}

	.toc-container {
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 1rem;
		padding: 1.25rem;
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
	}

	:global(.dark) .toc-container {
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.toc-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin: 0 0 1rem 0;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
	}

	:global(.dark) .toc-title {
		border-bottom-color: rgba(255, 255, 255, 0.1);
	}

	.toc-nav {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.toc-item {
		display: block;
		width: 100%;
		text-align: left;
		padding: 0.625rem 0.875rem;
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		background: transparent;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.15s ease;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.toc-item:hover {
		color: hsl(var(--color-foreground));
		background: hsl(var(--color-muted) / 0.5);
	}

	.toc-item.active {
		color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.12);
		font-weight: 600;
	}

	/* Main Content Area - Always centered */
	.settings-main {
		width: 100%;
		padding: 2rem 1rem;
	}

	@media (min-width: 640px) {
		.settings-main {
			padding: 2rem 1.5rem;
		}
	}

	@media (min-width: 1024px) {
		.settings-main {
			padding: 2rem;
		}
	}

	.settings-content {
		margin-left: auto;
		margin-right: auto;
	}

	.settings-header {
		margin-bottom: 2rem;
	}

	.sections-container {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
</style>
