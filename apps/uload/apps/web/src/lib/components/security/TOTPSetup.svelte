<script>
	import { onMount } from 'svelte';
	import {
		generateSecret,
		generateQRCodeURL,
		generateTOTP,
		verifyTOTP,
		generateBackupCodes,
	} from '$lib/security/totp';
	import { toast } from 'svelte-sonner';

	interface Props {
		userEmail: string;
		onComplete?: (secret: string, backupCodes: string[]) => void;
		onCancel?: () => void;
	}

	let { userEmail, onComplete, onCancel }: Props = $props();

	// State
	let step = $state(1); // 1: QR Code, 2: Verification, 3: Backup Codes
	let secret = $state('');
	let qrCodeURL = $state('');
	let verificationCode = $state('');
	let backupCodes = $state<string[]>([]);
	let isVerifying = $state(false);
	let currentToken = $state('');
	let timeRemaining = $state(30);

	// Timer für TOTP Updates
	let interval: ReturnType<typeof setInterval>;

	onMount(() => {
		// Generiere Secret und QR Code
		secret = generateSecret();
		qrCodeURL = generateQRCodeURL(secret, userEmail, 'uLoad');
		backupCodes = generateBackupCodes();

		// Starte Timer für aktuellen TOTP
		updateCurrentToken();
		interval = setInterval(updateCurrentToken, 1000);

		return () => {
			if (interval) clearInterval(interval);
		};
	});

	function updateCurrentToken() {
		if (!secret) return;

		const result = generateTOTP({ secret });
		currentToken = result.token;
		timeRemaining = result.timeRemaining;
	}

	async function verifyCode() {
		if (!verificationCode || verificationCode.length !== 6) {
			toast.error('Bitte geben Sie einen 6-stelligen Code ein');
			return;
		}

		isVerifying = true;

		try {
			const isValid = verifyTOTP(verificationCode.replace(/\s/g, ''), { secret });

			if (isValid) {
				toast.success('2FA erfolgreich eingerichtet!');
				step = 3; // Zeige Backup Codes
			} else {
				toast.error('Ungültiger Code. Bitte versuchen Sie es erneut.');
			}
		} catch (error) {
			console.error('TOTP verification error:', error);
			toast.error('Fehler bei der Verifizierung');
		} finally {
			isVerifying = false;
		}
	}

	function completeSetup() {
		onComplete?.(secret, backupCodes);
	}

	function handleCancel() {
		onCancel?.();
	}

	function copyBackupCodes() {
		const codesText = backupCodes.join('\n');
		navigator.clipboard.writeText(codesText);
		toast.success('Backup-Codes in Zwischenablage kopiert');
	}

	function downloadBackupCodes() {
		const codesText = `uLoad 2FA Backup Codes
Generated: ${new Date().toLocaleDateString()}
Account: ${userEmail}

${backupCodes.join('\n')}

⚠️ WICHTIG:
- Bewahren Sie diese Codes an einem sicheren Ort auf
- Jeder Code kann nur einmal verwendet werden
- Verwenden Sie diese Codes nur, wenn Sie keinen Zugang zu Ihrer Authenticator-App haben
`;

		const blob = new Blob([codesText], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'uload-2fa-backup-codes.txt';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		toast.success('Backup-Codes heruntergeladen');
	}

	// Format verification code input
	function formatVerificationCode(value: string) {
		const cleaned = value.replace(/\D/g, '');
		if (cleaned.length <= 3) {
			return cleaned;
		}
		return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)}`;
	}

	function handleVerificationInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const formatted = formatVerificationCode(target.value);
		verificationCode = formatted;

		// Auto-submit wenn 6 Ziffern eingegeben
		const digits = formatted.replace(/\s/g, '');
		if (digits.length === 6) {
			setTimeout(verifyCode, 100);
		}
	}
</script>

<div class="mx-auto max-w-2xl p-6">
	<!-- Header -->
	<div class="mb-8 text-center">
		<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
			<svg class="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
				/>
			</svg>
		</div>
		<h2 class="mb-2 text-2xl font-bold text-gray-900">Zwei-Faktor-Authentifizierung einrichten</h2>
		<p class="text-gray-600">Erhöhen Sie die Sicherheit Ihres Kontos mit 2FA</p>
	</div>

	<!-- Progress Steps -->
	<div class="mb-8 flex items-center justify-center">
		<div class="flex items-center space-x-4">
			{#each [1, 2, 3] as stepNumber}
				<div class="flex items-center">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium
						{step >= stepNumber ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}"
					>
						{stepNumber}
					</div>
					{#if stepNumber < 3}
						<div class="h-0.5 w-12 {step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'} mx-2"></div>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	{#if step === 1}
		<!-- Schritt 1: QR Code scannen -->
		<div class="rounded-xl border border-gray-200 bg-white p-6">
			<h3 class="mb-4 text-lg font-semibold">1. Authenticator-App einrichten</h3>

			<div class="mb-6 text-center">
				<!-- QR Code Placeholder -->
				<div class="mx-auto mb-4 flex h-48 w-48 items-center justify-center rounded-lg bg-gray-100">
					{#if qrCodeURL}
						<!-- In Produktion würde hier ein echter QR Code generiert werden -->
						<div class="text-center">
							<div
								class="mb-2 flex h-32 w-32 items-center justify-center rounded-lg border-2 border-gray-300 bg-white"
							>
								<span class="text-xs text-gray-500">QR Code</span>
							</div>
							<p class="text-xs text-gray-500">
								Scannen Sie diesen Code mit Ihrer Authenticator-App
							</p>
						</div>
					{:else}
						<div
							class="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"
						></div>
					{/if}
				</div>

				<p class="mb-4 text-sm text-gray-600">
					Scannen Sie den QR-Code mit einer Authenticator-App wie Google Authenticator, Authy oder
					1Password
				</p>

				<!-- Manual entry option -->
				<details class="text-left">
					<summary class="cursor-pointer text-sm text-blue-600 hover:text-blue-700">
						Manueller Setup-Code
					</summary>
					<div class="mt-3 rounded-lg bg-gray-50 p-3">
						<p class="mb-2 text-xs text-gray-600">Falls Sie den QR-Code nicht scannen können:</p>
						<code class="block break-all rounded border bg-white p-2 font-mono text-sm">
							{secret}
						</code>
						<button
							onclick={() => navigator.clipboard.writeText(secret)}
							class="mt-2 text-xs text-blue-600 hover:text-blue-700"
						>
							Code kopieren
						</button>
					</div>
				</details>
			</div>

			<div class="flex space-x-3">
				<button
					onclick={handleCancel}
					class="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
				>
					Abbrechen
				</button>
				<button
					onclick={() => (step = 2)}
					disabled={!qrCodeURL}
					class="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					Weiter
				</button>
			</div>
		</div>
	{:else if step === 2}
		<!-- Schritt 2: Code verifizieren -->
		<div class="rounded-xl border border-gray-200 bg-white p-6">
			<h3 class="mb-4 text-lg font-semibold">2. Code verifizieren</h3>

			<div class="mb-6 text-center">
				<p class="mb-6 text-gray-600">
					Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein:
				</p>

				<!-- Verification Code Input -->
				<div class="mb-4">
					<input
						type="text"
						bind:value={verificationCode}
						oninput={handleVerificationInput}
						placeholder="000 000"
						maxlength="7"
						class="w-40 rounded-lg border-2 border-gray-300 px-4 py-3 text-center font-mono text-2xl focus:border-blue-500 focus:outline-none"
						autocomplete="off"
						spellcheck="false"
					/>
				</div>

				<!-- Current TOTP for debugging (in dev only) -->
				{#if import.meta.env.DEV}
					<div class="mb-4 text-xs text-gray-400">
						<p>Aktueller Code: <span class="font-mono">{currentToken}</span></p>
						<p>Läuft ab in: {timeRemaining}s</p>
					</div>
				{/if}

				<p class="text-sm text-gray-500">Der Code ändert sich alle 30 Sekunden</p>
			</div>

			<div class="flex space-x-3">
				<button
					onclick={() => (step = 1)}
					class="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
				>
					Zurück
				</button>
				<button
					onclick={verifyCode}
					disabled={isVerifying || verificationCode.replace(/\s/g, '').length !== 6}
					class="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if isVerifying}
						<span class="flex items-center justify-center">
							<svg class="-ml-1 mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							Verifiziere...
						</span>
					{:else}
						Verifizieren
					{/if}
				</button>
			</div>
		</div>
	{:else if step === 3}
		<!-- Schritt 3: Backup Codes -->
		<div class="rounded-xl border border-gray-200 bg-white p-6">
			<h3 class="mb-4 text-lg font-semibold">3. Backup-Codes sichern</h3>

			<div class="mb-6">
				<div class="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
					<div class="flex">
						<svg
							class="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-400"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								fill-rule="evenodd"
								d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
								clip-rule="evenodd"
							/>
						</svg>
						<div>
							<h4 class="font-medium text-yellow-800">Wichtig: Backup-Codes sichern</h4>
							<p class="mt-1 text-sm text-yellow-700">
								Bewahren Sie diese Codes an einem sicheren Ort auf. Sie können verwendet werden,
								wenn Sie keinen Zugang zu Ihrer Authenticator-App haben.
							</p>
						</div>
					</div>
				</div>

				<!-- Backup Codes Grid -->
				<div class="mb-6 grid grid-cols-2 gap-3">
					{#each backupCodes as code}
						<div class="rounded-lg bg-gray-50 p-3 text-center">
							<code class="font-mono text-sm">{code}</code>
						</div>
					{/each}
				</div>

				<!-- Action Buttons -->
				<div class="mb-6 flex space-x-3">
					<button
						onclick={copyBackupCodes}
						class="flex flex-1 items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
					>
						<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
							/>
						</svg>
						Kopieren
					</button>
					<button
						onclick={downloadBackupCodes}
						class="flex flex-1 items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
					>
						<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
						Download
					</button>
				</div>
			</div>

			<div class="border-t pt-6">
				<button
					onclick={completeSetup}
					class="w-full rounded-lg bg-green-600 px-4 py-3 font-medium text-white transition-colors hover:bg-green-700"
				>
					2FA-Einrichtung abschließen
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	/* Custom styles für bessere UX */
	input[type='text']:focus {
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	code {
		letter-spacing: 0.05em;
	}
</style>
