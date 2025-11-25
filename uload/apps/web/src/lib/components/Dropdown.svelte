<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';

	interface DropdownItem {
		label?: string;
		icon?: string;
		color?: string;
		action?: () => void;
		href?: string;
		type?: 'button' | 'submit' | 'link' | 'form';
		formAction?: string;
		formMethod?: 'POST' | 'GET';
		formData?: Record<string, string>;
		divider?: boolean;
		enhanceOptions?: (options: any) => any;
	}

	interface Props {
		items: DropdownItem[];
		buttonText?: string;
		buttonIcon?: string;
		variant?: 'primary' | 'secondary' | 'ghost';
		size?: 'sm' | 'md' | 'lg';
		position?: 'left' | 'right';
		class?: string;
	}

	let {
		items,
		buttonText = 'Actions',
		buttonIcon,
		variant = 'secondary',
		size = 'md',
		position = 'right',
		class: className = ''
	}: Props = $props();

	let isOpen = $state(false);
	let dropdownRef: HTMLDivElement;
	let buttonRef: HTMLButtonElement;
	let menuRef: HTMLDivElement;
	let dropdownPosition = $state({ top: 0, left: 0 });

	function toggleDropdown() {
		if (!isOpen && buttonRef) {
			const rect = buttonRef.getBoundingClientRect();
			dropdownPosition = {
				top: rect.bottom + window.scrollY + 8,
				left: position === 'left' ? rect.left + window.scrollX : rect.right + window.scrollX - 192
			};
		}
		isOpen = !isOpen;
	}

	function closeDropdown() {
		isOpen = false;
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as Node;
		// Check if click is outside both the dropdown container and the menu
		if (dropdownRef && !dropdownRef.contains(target) && 
		    menuRef && !menuRef.contains(target)) {
			closeDropdown();
		}
	}

	function handleItemClick(item: DropdownItem) {
		if (item.action) {
			item.action();
		}
		closeDropdown();
	}

	function getItemClasses(color?: string) {
		const baseClasses = 'flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors';
		if (!color) return `${baseClasses} text-theme-text hover:bg-theme-surface-hover`;
		
		switch(color) {
			case '#dc2626': return `${baseClasses} text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20`;
			case '#ea580c': return `${baseClasses} text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20`;
			case '#16a34a': return `${baseClasses} text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20`;
			case '#2563eb': return `${baseClasses} text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20`;
			case '#9333ea': return `${baseClasses} text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20`;
			case '#4f46e5': return `${baseClasses} text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20`;
			default: return `${baseClasses} text-theme-text hover:bg-theme-surface-hover`;
		}
	}

	onMount(() => {
		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});

	const sizeClasses = {
		sm: 'px-2 py-1 text-sm',
		md: 'px-3 py-2 text-base',
		lg: 'px-4 py-3 text-lg'
	};

	const variantClasses = {
		primary: 'bg-theme-primary text-white hover:bg-theme-primary-hover',
		secondary: 'bg-theme-surface border border-theme-border text-theme-text hover:bg-theme-surface-hover',
		ghost: 'text-theme-text hover:bg-theme-surface-hover'
	};

	const positionClasses = {
		left: 'left-0',
		right: 'right-0'
	};
</script>

<div class="relative {className}" bind:this={dropdownRef}>
	<button
		bind:this={buttonRef}
		onclick={toggleDropdown}
		class="inline-flex items-center gap-2 rounded-lg font-medium transition-colors {sizeClasses[size]} {variantClasses[variant]}"
		type="button"
	>
		{#if buttonIcon}
			{@html buttonIcon}
		{/if}
		<span>{buttonText}</span>
		<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if isOpen}
		<div
			bind:this={menuRef}
			class="fixed z-[9999] min-w-[12rem] rounded-lg border border-theme-border bg-theme-surface shadow-lg"
			style="top: {dropdownPosition.top}px; left: {dropdownPosition.left}px"
		>
			{#each items as item, index}
				{#if item.divider}
					<div class="border-t border-theme-border"></div>
				{:else if item.type === 'form'}
					<form 
						method={item.formMethod || 'POST'} 
						action={item.formAction}
						use:enhance={item.enhanceOptions || (() => {
							return async ({ update }) => {
								closeDropdown();
								await update();
							};
						})}
					>
						{#if item.formData}
							{#each Object.entries(item.formData) as [name, value]}
								<input type="hidden" {name} {value} />
							{/each}
						{/if}
						<button
							type="submit"
							class={getItemClasses(item.color)}
						>
							{#if item.icon}
								{@html item.icon}
							{/if}
							{item.label}
						</button>
					</form>
				{:else if item.href}
					<a
						href={item.href}
						onclick={() => closeDropdown()}
						class={getItemClasses(item.color)}
					>
						{#if item.icon}
							{@html item.icon}
						{/if}
						{item.label}
					</a>
				{:else}
					<button
						onclick={() => handleItemClick(item)}
						type={item.type || 'button'}
						class={getItemClasses(item.color)}
					>
						{#if item.icon}
							{@html item.icon}
						{/if}
						{item.label}
					</button>
				{/if}
			{/each}
		</div>
	{/if}
</div>