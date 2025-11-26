<script lang="ts">
	import { t } from 'svelte-i18n';
	import PinButton from './PinButton.svelte';

	interface Props {
		onEdit?: () => void;
		onDelete?: () => void;
		onShare?: () => void;
		onCopy?: () => void;
		onSearch?: () => void;
		onCreateMemory?: () => void;
		onAskQuestion?: () => void;
		onReprocess?: () => void;
		onManageSpeakers?: () => void;
		onTranslate?: () => void;
		onFindReplace?: () => void;
		onShowShortcuts?: () => void;
		onPinToggle?: () => void;
		isPinned?: boolean;
		isEditMode?: boolean;
	}

	let {
		onEdit,
		onDelete,
		onShare,
		onCopy,
		onSearch,
		onCreateMemory,
		onAskQuestion,
		onReprocess,
		onManageSpeakers,
		onTranslate,
		onFindReplace,
		onShowShortcuts,
		onPinToggle,
		isPinned = false,
		isEditMode = false
	}: Props = $props();

	let showMoreMenu = $state(false);

	interface Action {
		id: string;
		label: string;
		icon: string;
		onClick: () => void;
		disabled?: boolean;
		danger?: boolean;
	}

	// Primary actions always visible
	const primaryActions: Action[] = $derived([
		{
			id: 'edit',
			label: isEditMode ? $t('common.cancel') : $t('memo.edit'),
			icon: isEditMode ? 'x' : 'edit',
			onClick: onEdit || (() => {}),
			disabled: !onEdit
		},
		{
			id: 'search',
			label: $t('memo.search'),
			icon: 'search',
			onClick: onSearch || (() => {}),
			disabled: !onSearch
		},
		{
			id: 'copy',
			label: $t('memo.copy'),
			icon: 'copy',
			onClick: onCopy || (() => {}),
			disabled: !onCopy
		},
		{
			id: 'share',
			label: $t('memo.share'),
			icon: 'share',
			onClick: onShare || (() => {}),
			disabled: !onShare
		},
		{
			id: 'ask-question',
			label: $t('memo.ask_question'),
			icon: 'question',
			onClick: onAskQuestion || (() => {}),
			disabled: !onAskQuestion || isEditMode
		},
		{
			id: 'pin',
			label: isPinned ? $t('memo.unpin') : $t('memo.pin'),
			icon: 'pin',
			onClick: onPinToggle || (() => {}),
			disabled: !onPinToggle
		}
	]);

	// Actions hidden behind "More" menu
	const moreActions: Action[] = $derived([
		{
			id: 'create-memory',
			label: $t('memo.create_memory'),
			icon: 'lightbulb',
			onClick: onCreateMemory || (() => {}),
			disabled: !onCreateMemory || isEditMode
		},
		{
			id: 'reprocess',
			label: $t('memo.reprocess'),
			icon: 'refresh',
			onClick: onReprocess || (() => {}),
			disabled: !onReprocess || isEditMode
		},
		{
			id: 'manage-speakers',
			label: $t('memo.speakers'),
			icon: 'users',
			onClick: onManageSpeakers || (() => {}),
			disabled: !onManageSpeakers || isEditMode
		},
		{
			id: 'translate',
			label: $t('memo.translate'),
			icon: 'language',
			onClick: onTranslate || (() => {}),
			disabled: !onTranslate || isEditMode
		},
		{
			id: 'find-replace',
			label: $t('memo.find_replace'),
			icon: 'replace',
			onClick: onFindReplace || (() => {}),
			disabled: !onFindReplace || isEditMode
		},
		{
			id: 'shortcuts',
			label: $t('memo.shortcuts'),
			icon: 'keyboard',
			onClick: onShowShortcuts || (() => {}),
			disabled: !onShowShortcuts || isEditMode
		},
		{
			id: 'delete',
			label: $t('common.delete'),
			icon: 'trash',
			onClick: onDelete || (() => {}),
			disabled: !onDelete,
			danger: true
		}
	]);

	function handleMoreAction(action: Action) {
		action.onClick();
		showMoreMenu = false;
	}

	function getIcon(iconName: string) {
		const icons: Record<string, string> = {
			edit: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
			x: 'M6 18L18 6M6 6l12 12',
			search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
			copy: 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z',
			share: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z',
			tag: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
			trash: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
			lightbulb: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
			question: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
			refresh: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
			users: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
			language: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129',
			replace: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z',
			folder: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
			keyboard: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
			pin: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z'
		};
		return icons[iconName] || '';
	}

	function getButtonClass(danger: boolean = false) {
		const baseClasses =
			'flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all text-sm';

		if (danger) {
			return `${baseClasses} bg-red-600 text-white hover:bg-red-700`;
		}

		return `${baseClasses} bg-menu hover:bg-menu-hover text-theme border border-theme`;
	}
</script>

<div class="actions-bar">
	<div class="options-container">
		<!-- Options Button -->
		<button
			onclick={() => (showMoreMenu = !showMoreMenu)}
			class="pill glass-pill options-button"
		>
			<svg
				class="pill-icon"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
				/>
			</svg>
			<span class="pill-label">{$t('memo.options')}</span>
		</button>

		{#if showMoreMenu}
			<!-- Backdrop -->
			<button
				class="menu-backdrop"
				onclick={() => (showMoreMenu = false)}
				onkeydown={(e) => e.key === 'Escape' && (showMoreMenu = false)}
			></button>

			<!-- Fan out pills upward -->
			<div class="fan-container">
				{#each [...primaryActions, ...moreActions].filter((a) => !a.disabled) as action, i (action.id)}
					<button
						onclick={() => handleMoreAction(action)}
						class="pill glass-pill fan-pill"
						class:danger-pill={action.danger}
						style="animation-delay: {i * 15}ms"
					>
						<svg
							class="pill-icon"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d={getIcon(action.icon)}
							/>
						</svg>
						<span class="pill-label">{action.label}</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.actions-bar {
		position: absolute;
		bottom: 0;
		right: 0;
		padding: 2rem;
		display: flex;
		justify-content: flex-end;
		pointer-events: none;
		z-index: 20;
	}

	.options-container {
		position: relative;
		pointer-events: auto;
	}

	.options-button {
		position: relative;
		z-index: 10;
	}

	.fan-container {
		position: absolute;
		bottom: calc(100% + 0.5rem);
		right: 0;
		display: flex;
		flex-direction: column-reverse;
		gap: 0.5rem;
		z-index: 50;
	}

	.fan-pill {
		animation: fanIn 0.15s ease-out forwards;
		opacity: 0;
		transform: translateY(20px);
	}

	@keyframes fanIn {
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.pill {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
		white-space: nowrap;
		text-decoration: none;
		transition: all 0.2s;
		border: none;
		cursor: pointer;
	}

	.glass-pill {
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
		color: #374151;
	}

	:global(.dark) .glass-pill {
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.15);
		color: #f3f4f6;
	}

	.glass-pill:hover {
		background: rgba(255, 255, 255, 0.95);
		border-color: rgba(0, 0, 0, 0.15);
		transform: translateY(-2px);
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .glass-pill:hover {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.25);
	}

	.danger-pill {
		color: #dc2626;
	}

	:global(.dark) .danger-pill {
		color: #ef4444;
	}

	.danger-pill:hover {
		background: rgba(220, 38, 38, 0.15);
		border-color: rgba(220, 38, 38, 0.3);
	}

	.pill-icon {
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
	}

	.pill-label {
		display: inline;
	}

	/* Backdrop */
	.menu-backdrop {
		position: fixed;
		inset: 0;
		z-index: 40;
		background: transparent;
		border: none;
		cursor: default;
	}
</style>
