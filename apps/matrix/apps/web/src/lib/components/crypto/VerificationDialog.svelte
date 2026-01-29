<script lang="ts">
	import { matrixStore } from '$lib/matrix';
	import type { DeviceInfo, VerificationRequest } from '$lib/matrix/types';
	import { formatDeviceName } from '$lib/matrix/crypto';
	import {
		X,
		Shield,
		ShieldCheck,
		ShieldWarning,
		DeviceMobile,
		Monitor,
		CircleNotch,
		ArrowsClockwise,
	} from '@manacore/shared-icons';
	import EmojiVerification from './EmojiVerification.svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open, onClose }: Props = $props();

	let devices = $state<DeviceInfo[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let verificationStarted = $state(false);
	let selectedDevice = $state<DeviceInfo | null>(null);

	// Subscribe to active verification
	let activeVerification = $derived(matrixStore.activeVerification);

	$effect(() => {
		if (open) {
			loadDevices();
		}
	});

	async function loadDevices() {
		loading = true;
		error = null;
		try {
			devices = await matrixStore.getDevices();
		} catch (err) {
			error = 'Geräte konnten nicht geladen werden';
			console.error('Error loading devices:', err);
		}
		loading = false;
	}

	async function startVerification(device: DeviceInfo) {
		if (device.isCurrentDevice) return;

		selectedDevice = device;
		verificationStarted = true;

		const success = await matrixStore.startVerification(
			matrixStore.userId || undefined,
			device.deviceId
		);

		if (!success) {
			error = 'Verifizierung konnte nicht gestartet werden';
			verificationStarted = false;
			selectedDevice = null;
		}
	}

	async function handleVerificationComplete() {
		verificationStarted = false;
		selectedDevice = null;
		await loadDevices();
	}

	function handleVerificationCancel() {
		if (activeVerification) {
			matrixStore.cancelVerification(activeVerification.requestId);
		}
		verificationStarted = false;
		selectedDevice = null;
	}

	function handleClose() {
		if (verificationStarted && activeVerification) {
			matrixStore.cancelVerification(activeVerification.requestId);
		}
		verificationStarted = false;
		selectedDevice = null;
		error = null;
		onClose();
	}

	function getDeviceIcon(device: DeviceInfo) {
		const name = (device.displayName || '').toLowerCase();
		if (
			name.includes('mobile') ||
			name.includes('phone') ||
			name.includes('android') ||
			name.includes('ios')
		) {
			return DeviceMobile;
		}
		return Monitor;
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
		onclick={handleClose}
	>
		<div
			class="w-full max-w-lg rounded-xl bg-surface shadow-xl"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-border px-6 py-4">
				<div class="flex items-center gap-3">
					<Shield class="h-6 w-6 text-primary" />
					<h2 class="text-xl font-semibold">Geräte-Verifizierung</h2>
				</div>
				<button class="btn-ghost rounded-full p-2" onclick={handleClose}>
					<X class="h-5 w-5" />
				</button>
			</div>

			<!-- Content -->
			<div class="px-6 py-4">
				{#if verificationStarted && activeVerification}
					<!-- Verification in progress -->
					<EmojiVerification
						request={activeVerification}
						onComplete={handleVerificationComplete}
						onCancel={handleVerificationCancel}
					/>
				{:else}
					<!-- Device list -->
					<div class="space-y-4">
						<p class="text-muted-foreground">
							Verifiziere deine Geräte um sicherzustellen, dass du der einzige bist, der auf deine
							verschlüsselten Nachrichten zugreifen kann.
						</p>

						{#if error}
							<div class="rounded-lg bg-error/10 p-3 text-error">
								<span>{error}</span>
							</div>
						{/if}

						{#if loading}
							<div class="flex justify-center py-8">
								<CircleNotch class="h-8 w-8 animate-spin text-primary" />
							</div>
						{:else if devices.length === 0}
							<div class="py-8 text-center text-muted-foreground">
								<p>Keine Geräte gefunden</p>
							</div>
						{:else}
							<div class="space-y-2">
								{#each devices as device}
									{@const DeviceIcon = getDeviceIcon(device)}
									<div
										class="flex items-center gap-4 rounded-lg border border-border p-4 {device.isCurrentDevice
											? 'bg-muted'
											: ''}"
									>
										<div class="flex-shrink-0">
											{#if device.verified}
												<div class="relative">
													<DeviceIcon class="h-10 w-10 text-muted-foreground" />
													<ShieldCheck class="absolute -right-1 -bottom-1 h-5 w-5 text-success" />
												</div>
											{:else if device.blocked}
												<div class="relative">
													<DeviceIcon class="h-10 w-10 text-muted-foreground" />
													<ShieldWarning class="absolute -right-1 -bottom-1 h-5 w-5 text-error" />
												</div>
											{:else}
												<div class="relative">
													<DeviceIcon class="h-10 w-10 text-muted-foreground" />
													<ShieldWarning class="absolute -right-1 -bottom-1 h-5 w-5 text-warning" />
												</div>
											{/if}
										</div>

										<div class="flex-1 min-w-0">
											<div class="flex items-center gap-2">
												<span class="font-medium truncate">
													{formatDeviceName(device.displayName, device.deviceId)}
												</span>
												{#if device.isCurrentDevice}
													<span class="badge badge-primary text-xs">Dieses Gerät</span>
												{/if}
											</div>
											<div class="text-sm text-muted-foreground">
												{device.deviceId}
											</div>
											<div class="text-xs mt-1">
												{#if device.verified}
													<span class="text-success">Verifiziert</span>
												{:else if device.blocked}
													<span class="text-error">Blockiert</span>
												{:else}
													<span class="text-warning">Nicht verifiziert</span>
												{/if}
											</div>
										</div>

										{#if !device.isCurrentDevice && !device.verified}
											<button class="btn-primary text-sm" onclick={() => startVerification(device)}>
												Verifizieren
											</button>
										{/if}
									</div>
								{/each}
							</div>
						{/if}

						<!-- Refresh button -->
						<div class="flex justify-center pt-2">
							<button
								class="btn-ghost flex items-center gap-2 text-sm"
								onclick={loadDevices}
								disabled={loading}
							>
								<ArrowsClockwise class={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
								Aktualisieren
							</button>
						</div>
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="flex justify-end border-t border-border px-6 py-4">
				<button class="btn-ghost" onclick={handleClose}>
					{verificationStarted ? 'Abbrechen' : 'Schließen'}
				</button>
			</div>
		</div>
	</div>
{/if}
