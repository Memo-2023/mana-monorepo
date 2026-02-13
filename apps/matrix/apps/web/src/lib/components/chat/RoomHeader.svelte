<script lang="ts">
	import { matrixStore } from '$lib/matrix';
	import {
		ArrowLeft,
		List,
		Phone,
		VideoCamera,
		Info,
		LockOpen,
		ShieldCheck,
		ShieldWarning,
		Users,
		MagnifyingGlass,
	} from '@manacore/shared-icons';

	interface Props {
		onMenuClick?: () => void;
		onInfoClick?: () => void;
		onSearchClick?: () => void;
		onVoiceCall?: () => void;
		onVideoCall?: () => void;
		showBackButton?: boolean;
		onBackClick?: () => void;
	}

	let {
		onMenuClick,
		onInfoClick,
		onSearchClick,
		onVoiceCall,
		onVideoCall,
		showBackButton = false,
		onBackClick,
	}: Props = $props();

	// Check if calls are possible (DMs only for now)
	let canCall = $derived(matrixStore.currentSimpleRoom?.isDirect ?? false);

	let room = $derived(matrixStore.currentSimpleRoom);
	let cryptoReady = $derived(matrixStore.cryptoReady);
	let encryptionStatus = $state<{
		encrypted: boolean;
		allDevicesVerified: boolean;
		unverifiedDevices: number;
	}>({
		encrypted: false,
		allDevicesVerified: false,
		unverifiedDevices: 0,
	});

	// Load encryption status when room changes
	$effect(() => {
		if (room && cryptoReady) {
			matrixStore.getRoomEncryptionStatus(room.id).then((status) => {
				encryptionStatus = status;
			});
		}
	});

	// Presence for DMs
	let isOnline = $derived(room?.isDirect && room?.presence === 'online');

	// Format last active time
	let presenceText = $derived(() => {
		if (!room?.isDirect) return '';
		if (room.presence === 'online') return 'Online';
		if (!room.lastActiveAgo) return 'Offline';
		const minutes = Math.floor(room.lastActiveAgo / 60000);
		if (minutes < 1) return 'Gerade aktiv';
		if (minutes < 60) return `Vor ${minutes} Min. aktiv`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `Vor ${hours} Std. aktiv`;
		const days = Math.floor(hours / 24);
		return `Vor ${days} Tag${days > 1 ? 'en' : ''} aktiv`;
	});
</script>

{#if room}
	<header
		class="flex items-center gap-3 border-b border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm px-4 py-3"
	>
		<!-- Mobile back button or menu button -->
		{#if showBackButton}
			<button
				class="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
				onclick={onBackClick}
				aria-label="Zurück"
			>
				<ArrowLeft class="h-5 w-5" />
			</button>
		{:else}
			<button
				class="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors lg:hidden"
				onclick={onMenuClick}
			>
				<List class="h-5 w-5" />
			</button>
		{/if}

		<!-- Room avatar with online indicator -->
		<div class="relative flex-shrink-0">
			<div
				class="flex h-10 w-10 items-center justify-center rounded-full shadow-md
				       bg-gradient-to-br from-violet-500 to-purple-600 text-white"
			>
				{#if room.avatar}
					<img src={room.avatar} alt={room.name} class="h-10 w-10 rounded-full object-cover" />
				{:else}
					<span class="text-sm font-semibold">{room.name.charAt(0).toUpperCase()}</span>
				{/if}
			</div>
			<!-- Online indicator for DMs -->
			{#if room.isDirect}
				<div
					class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-zinc-900
					       {isOnline ? 'bg-green-500' : 'bg-zinc-400 dark:bg-zinc-600'}"
					title={presenceText()}
				></div>
			{/if}
		</div>

		<!-- Room info -->
		<div class="min-w-0 flex-1">
			<div class="flex items-center gap-2">
				<h2 class="truncate font-semibold text-foreground">{room.name}</h2>
				{#if room.isEncrypted}
					{#if encryptionStatus.allDevicesVerified}
						<div class="flex-shrink-0" title="Verschlüsselt - Alle Geräte verifiziert">
							<ShieldCheck class="h-4 w-4 text-green-500" />
						</div>
					{:else}
						<div
							class="flex-shrink-0"
							title="Verschlüsselt - {encryptionStatus.unverifiedDevices} unverifizierte Geräte"
						>
							<ShieldWarning class="h-4 w-4 text-amber-500" />
						</div>
					{/if}
				{:else}
					<div class="flex-shrink-0" title="Nicht verschlüsselt">
						<LockOpen class="h-4 w-4 text-muted-foreground" />
					</div>
				{/if}
			</div>
			<p class="flex items-center gap-1.5 text-sm text-muted-foreground">
				{#if room.topic}
					<span class="truncate">{room.topic}</span>
				{:else if room.isDirect}
					<span class="flex items-center gap-1.5">
						{#if isOnline}
							<span class="w-2 h-2 rounded-full bg-green-500"></span>
							<span class="text-green-600 dark:text-green-400">Online</span>
						{:else}
							<span class="w-2 h-2 rounded-full bg-zinc-400"></span>
							<span>{presenceText() || 'Offline'}</span>
						{/if}
					</span>
				{:else}
					<Users class="h-3 w-3" />
					<span>{room.memberCount} Mitglieder</span>
				{/if}
			</p>
		</div>

		<!-- Actions -->
		<div class="flex items-center gap-1">
			<button
				class="p-2.5 rounded-xl glass-button shadow-sm"
				title="Suchen"
				onclick={onSearchClick}
			>
				<MagnifyingGlass class="h-5 w-5 text-muted-foreground" />
			</button>
			<button
				class="hidden sm:flex p-2.5 rounded-xl glass-button shadow-sm transition-colors
				       {canCall ? 'hover:bg-green-500/10 hover:text-green-500' : 'opacity-40 cursor-not-allowed'}"
				title={canCall ? 'Sprachanruf' : 'Anrufe nur in Direktnachrichten verfügbar'}
				disabled={!canCall}
				onclick={onVoiceCall}
			>
				<Phone class="h-5 w-5" />
			</button>
			<button
				class="hidden sm:flex p-2.5 rounded-xl glass-button shadow-sm transition-colors
				       {canCall ? 'hover:bg-violet-500/10 hover:text-violet-500' : 'opacity-40 cursor-not-allowed'}"
				title={canCall ? 'Videoanruf' : 'Anrufe nur in Direktnachrichten verfügbar'}
				disabled={!canCall}
				onclick={onVideoCall}
			>
				<VideoCamera class="h-5 w-5" />
			</button>
			<button
				class="p-2.5 rounded-xl glass-button shadow-sm"
				title="Rauminfo"
				onclick={onInfoClick}
			>
				<Info class="h-5 w-5 text-muted-foreground" />
			</button>
		</div>
	</header>
{/if}
