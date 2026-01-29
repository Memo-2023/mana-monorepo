<script lang="ts">
	import { matrixStore } from '$lib/matrix';
	import {
		List,
		Phone,
		VideoCamera,
		Info,
		LockOpen,
		ShieldCheck,
		ShieldWarning,
		Users,
	} from '@manacore/shared-icons';

	interface Props {
		onMenuClick?: () => void;
		onInfoClick?: () => void;
	}

	let { onMenuClick, onInfoClick }: Props = $props();

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
</script>

{#if room}
	<header
		class="flex items-center gap-3 border-b border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm px-4 py-3"
	>
		<!-- Mobile menu button -->
		<button
			class="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors lg:hidden"
			onclick={onMenuClick}
		>
			<List class="h-5 w-5" />
		</button>

		<!-- Room avatar -->
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
			<p class="flex items-center gap-1 text-sm text-muted-foreground">
				{#if room.topic}
					<span class="truncate">{room.topic}</span>
				{:else if room.isDirect}
					<span>Direktnachricht</span>
				{:else}
					<Users class="h-3 w-3" />
					<span>{room.memberCount} Mitglieder</span>
				{/if}
			</p>
		</div>

		<!-- Actions -->
		<div class="flex items-center gap-1">
			<button
				class="p-2.5 rounded-xl glass-button shadow-sm disabled:opacity-40"
				title="Sprachanruf"
				disabled
			>
				<Phone class="h-5 w-5 text-muted-foreground" />
			</button>
			<button
				class="p-2.5 rounded-xl glass-button shadow-sm disabled:opacity-40"
				title="Videoanruf"
				disabled
			>
				<VideoCamera class="h-5 w-5 text-muted-foreground" />
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
