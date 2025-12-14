<script lang="ts">
	import { onMount } from 'svelte';
	import { contactsApi, photoApi } from '$lib/api/contacts';
	import { contactsStore } from '$lib/stores/contacts.svelte';
	import { newContactModalStore } from '$lib/stores/new-contact-modal.svelte';

	interface Props {
		onClose: () => void;
		onSuccess?: () => void;
	}

	let { onClose, onSuccess }: Props = $props();

	let saving = $state(false);
	let error = $state<string | null>(null);
	let firstNameInput: HTMLInputElement;
	let fileInput: HTMLInputElement;

	// Photo state
	let selectedPhoto = $state<File | null>(null);
	let photoPreview = $state<string | null>(null);

	// Form state
	let firstName = $state('');
	let lastName = $state('');
	let email = $state('');
	let phone = $state('');
	let mobile = $state('');
	let company = $state('');
	let jobTitle = $state('');
	let street = $state('');
	let city = $state('');
	let postalCode = $state('');
	let country = $state('');
	let notes = $state('');

	// Social Media
	let linkedin = $state('');
	let twitter = $state('');
	let facebook = $state('');
	let instagram = $state('');
	let xing = $state('');
	let github = $state('');
	let youtube = $state('');
	let tiktok = $state('');
	let telegram = $state('');
	let whatsapp = $state('');
	let signal = $state('');
	let discord = $state('');
	let bluesky = $state('');
	let socialSectionOpen = $state(false);

	const initials = $derived(() => {
		const f = firstName?.[0] || '';
		const l = lastName?.[0] || '';
		return (f + l).toUpperCase() || '+';
	});

	const displayName = $derived(() => {
		if (firstName || lastName) {
			return [firstName, lastName].filter(Boolean).join(' ');
		}
		return email || 'Neuer Kontakt';
	});

	// Handle photo selection
	function handlePhotoSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			// Validate file type
			if (!file.type.startsWith('image/')) {
				error = 'Bitte wähle eine Bilddatei aus';
				return;
			}
			// Validate file size (max 5MB)
			if (file.size > 5 * 1024 * 1024) {
				error = 'Das Bild darf maximal 5MB groß sein';
				return;
			}
			selectedPhoto = file;
			// Create preview URL
			photoPreview = URL.createObjectURL(file);
		}
	}

	function removePhoto() {
		if (photoPreview) {
			URL.revokeObjectURL(photoPreview);
		}
		selectedPhoto = null;
		photoPreview = null;
		if (fileInput) {
			fileInput.value = '';
		}
	}

	// Populate form with prefill data if provided
	function populateFromPrefill() {
		const data = newContactModalStore.prefillData;
		if (data) {
			firstName = data.firstName || '';
			lastName = data.lastName || '';
			email = data.email || '';
			phone = data.phone || '';
			company = data.company || '';
			// Parse displayName if no first/last name
			if (data.displayName && !data.firstName && !data.lastName) {
				const parts = data.displayName.split(' ');
				firstName = parts[0] || '';
				lastName = parts.slice(1).join(' ') || '';
			}
		}
	}

	async function handleSave() {
		if (!firstName && !lastName && !email) {
			error = 'Bitte mindestens Name oder E-Mail angeben';
			return;
		}

		saving = true;
		error = null;

		try {
			const contact = await contactsApi.create({
				firstName: firstName || null,
				lastName: lastName || null,
				email: email || null,
				phone: phone || null,
				mobile: mobile || null,
				company: company || null,
				jobTitle: jobTitle || null,
				street: street || null,
				city: city || null,
				postalCode: postalCode || null,
				country: country || null,
				notes: notes || null,
				// Social Media
				linkedin: linkedin || null,
				twitter: twitter || null,
				facebook: facebook || null,
				instagram: instagram || null,
				xing: xing || null,
				github: github || null,
				youtube: youtube || null,
				tiktok: tiktok || null,
				telegram: telegram || null,
				whatsapp: whatsapp || null,
				signal: signal || null,
				discord: discord || null,
				bluesky: bluesky || null,
			});

			// Upload photo if selected
			if (selectedPhoto && contact.id) {
				try {
					await photoApi.upload(contact.id, selectedPhoto);
				} catch (photoError) {
					console.error('Photo upload failed:', photoError);
					// Don't fail the entire operation if photo upload fails
				}
			}

			// Reload contacts list
			await contactsStore.loadContacts();
			onSuccess?.();
			onClose();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Erstellen';
		} finally {
			saving = false;
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}

	onMount(() => {
		populateFromPrefill();
		document.body.style.overflow = 'hidden';
		// Focus first input after a brief delay to ensure modal animation completes
		setTimeout(() => {
			firstNameInput?.focus();
		}, 50);
		return () => {
			document.body.style.overflow = '';
			// Clean up photo preview URL
			if (photoPreview) {
				URL.revokeObjectURL(photoPreview);
			}
		};
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Modal Backdrop -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal-backdrop" onclick={handleBackdropClick}>
	<div class="modal-container" role="dialog" aria-modal="true" aria-labelledby="modal-title">
		<!-- Header -->
		<header class="modal-header">
			<button onclick={onClose} class="back-button" aria-label="Schließen">
				<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
			<h1 id="modal-title" class="title">Neuer Kontakt</h1>
			<div class="header-spacer"></div>
		</header>

		<!-- Modal Body -->
		<div class="modal-body">
			{#if error}
				<div class="error-banner" role="alert">
					<svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
					<span>{error}</span>
				</div>
			{/if}

			<!-- Avatar Preview with Photo Upload -->
			<div class="avatar-section">
				<input
					type="file"
					accept="image/*"
					class="hidden-file-input"
					bind:this={fileInput}
					onchange={handlePhotoSelect}
				/>
				<div class="avatar-wrapper">
					<button
						type="button"
						class="avatar-button"
						onclick={() => fileInput?.click()}
						title="Foto auswählen"
					>
						{#if photoPreview}
							<img src={photoPreview} alt="Vorschau" class="avatar-image" />
							<div class="avatar-overlay">
								<svg class="camera-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
									/>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
									/>
								</svg>
							</div>
						{:else}
							<div class="avatar-circle empty">
								<svg class="add-photo-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="1.5"
										d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
									/>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="1.5"
										d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
									/>
								</svg>
							</div>
						{/if}
					</button>
					{#if photoPreview}
						<button
							type="button"
							class="remove-photo-btn"
							onclick={removePhoto}
							title="Foto entfernen"
						>
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					{/if}
				</div>
				<p class="preview-name">{displayName()}</p>
				{#if company || jobTitle}
					<p class="preview-subtitle">{[jobTitle, company].filter(Boolean).join(' bei ')}</p>
				{/if}
			</div>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSave();
				}}
				class="form"
			>
				<!-- Name Section -->
				<section class="form-section">
					<div class="section-header">
						<div class="section-icon">
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
								/>
							</svg>
						</div>
						<h2 class="section-title">Name</h2>
					</div>
					<div class="form-grid">
						<div class="form-field">
							<label for="firstName" class="label">Vorname</label>
							<input
								id="firstName"
								type="text"
								bind:value={firstName}
								bind:this={firstNameInput}
								class="input"
								placeholder="Max"
							/>
						</div>
						<div class="form-field">
							<label for="lastName" class="label">Nachname</label>
							<input
								id="lastName"
								type="text"
								bind:value={lastName}
								class="input"
								placeholder="Mustermann"
							/>
						</div>
					</div>
				</section>

				<!-- Contact Section -->
				<section class="form-section">
					<div class="section-header">
						<div class="section-icon">
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
								/>
							</svg>
						</div>
						<h2 class="section-title">Kontakt</h2>
					</div>
					<div class="form-field">
						<label for="email" class="label">E-Mail</label>
						<input
							id="email"
							type="email"
							bind:value={email}
							class="input"
							placeholder="max@example.com"
						/>
					</div>
					<div class="form-grid">
						<div class="form-field">
							<label for="mobile" class="label">Mobil</label>
							<input
								id="mobile"
								type="tel"
								bind:value={mobile}
								class="input"
								placeholder="+49 170 1234567"
							/>
						</div>
						<div class="form-field">
							<label for="phone" class="label">Telefon</label>
							<input
								id="phone"
								type="tel"
								bind:value={phone}
								class="input"
								placeholder="+49 123 456789"
							/>
						</div>
					</div>
				</section>

				<!-- Work Section -->
				<section class="form-section">
					<div class="section-header">
						<div class="section-icon">
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
								/>
							</svg>
						</div>
						<h2 class="section-title">Arbeit</h2>
					</div>
					<div class="form-field">
						<label for="company" class="label">Firma</label>
						<input
							id="company"
							type="text"
							bind:value={company}
							class="input"
							placeholder="Musterfirma GmbH"
						/>
					</div>
					<div class="form-field">
						<label for="jobTitle" class="label">Position</label>
						<input
							id="jobTitle"
							type="text"
							bind:value={jobTitle}
							class="input"
							placeholder="Geschäftsführer"
						/>
					</div>
				</section>

				<!-- Address Section -->
				<section class="form-section">
					<div class="section-header">
						<div class="section-icon">
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
								/>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
								/>
							</svg>
						</div>
						<h2 class="section-title">Adresse</h2>
					</div>
					<div class="form-field">
						<label for="street" class="label">Straße & Hausnummer</label>
						<input
							id="street"
							type="text"
							bind:value={street}
							class="input"
							placeholder="Musterstraße 1"
						/>
					</div>
					<div class="form-grid">
						<div class="form-field">
							<label for="postalCode" class="label">PLZ</label>
							<input
								id="postalCode"
								type="text"
								bind:value={postalCode}
								class="input"
								placeholder="12345"
							/>
						</div>
						<div class="form-field">
							<label for="city" class="label">Stadt</label>
							<input id="city" type="text" bind:value={city} class="input" placeholder="Berlin" />
						</div>
					</div>
					<div class="form-field">
						<label for="country" class="label">Land</label>
						<input
							id="country"
							type="text"
							bind:value={country}
							class="input"
							placeholder="Deutschland"
						/>
					</div>
				</section>

				<!-- Notes Section -->
				<section class="form-section">
					<div class="section-header">
						<div class="section-icon">
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
								/>
							</svg>
						</div>
						<h2 class="section-title">Notizen</h2>
					</div>
					<textarea
						bind:value={notes}
						rows="4"
						class="input textarea"
						placeholder="Notizen zum Kontakt..."
					></textarea>
				</section>

				<!-- Social Media Section (Collapsible) -->
				<section class="form-section">
					<button
						type="button"
						class="section-header section-header-toggle"
						onclick={() => (socialSectionOpen = !socialSectionOpen)}
					>
						<div class="section-icon">
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
								/>
							</svg>
						</div>
						<h2 class="section-title">Social Media</h2>
						<svg
							class="chevron-icon"
							class:chevron-open={socialSectionOpen}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 9l-7 7-7-7"
							/>
						</svg>
					</button>
					{#if socialSectionOpen}
						<div class="social-grid">
							<div class="form-field">
								<label for="linkedin" class="label social-label">
									<span class="social-icon-label">in</span>
									LinkedIn
								</label>
								<input
									id="linkedin"
									type="url"
									bind:value={linkedin}
									class="input"
									placeholder="https://linkedin.com/in/..."
								/>
							</div>
							<div class="form-field">
								<label for="twitter" class="label social-label">
									<span class="social-icon-label">X</span>
									Twitter / X
								</label>
								<input
									id="twitter"
									type="text"
									bind:value={twitter}
									class="input"
									placeholder="@username"
								/>
							</div>
							<div class="form-field">
								<label for="facebook" class="label social-label">
									<span class="social-icon-label">f</span>
									Facebook
								</label>
								<input
									id="facebook"
									type="url"
									bind:value={facebook}
									class="input"
									placeholder="https://facebook.com/..."
								/>
							</div>
							<div class="form-field">
								<label for="instagram" class="label social-label">
									<span class="social-icon-label">ig</span>
									Instagram
								</label>
								<input
									id="instagram"
									type="text"
									bind:value={instagram}
									class="input"
									placeholder="@username"
								/>
							</div>
							<div class="form-field">
								<label for="xing" class="label social-label">
									<span class="social-icon-label">xi</span>
									Xing
								</label>
								<input
									id="xing"
									type="url"
									bind:value={xing}
									class="input"
									placeholder="https://xing.com/profile/..."
								/>
							</div>
							<div class="form-field">
								<label for="github" class="label social-label">
									<span class="social-icon-label">gh</span>
									GitHub
								</label>
								<input
									id="github"
									type="text"
									bind:value={github}
									class="input"
									placeholder="username"
								/>
							</div>
							<div class="form-field">
								<label for="youtube" class="label social-label">
									<span class="social-icon-label">yt</span>
									YouTube
								</label>
								<input
									id="youtube"
									type="url"
									bind:value={youtube}
									class="input"
									placeholder="https://youtube.com/@..."
								/>
							</div>
							<div class="form-field">
								<label for="tiktok" class="label social-label">
									<span class="social-icon-label">tt</span>
									TikTok
								</label>
								<input
									id="tiktok"
									type="text"
									bind:value={tiktok}
									class="input"
									placeholder="@username"
								/>
							</div>
							<div class="form-field">
								<label for="telegram" class="label social-label">
									<span class="social-icon-label">tg</span>
									Telegram
								</label>
								<input
									id="telegram"
									type="text"
									bind:value={telegram}
									class="input"
									placeholder="@username"
								/>
							</div>
							<div class="form-field">
								<label for="whatsapp" class="label social-label">
									<span class="social-icon-label">wa</span>
									WhatsApp
								</label>
								<input
									id="whatsapp"
									type="tel"
									bind:value={whatsapp}
									class="input"
									placeholder="+49..."
								/>
							</div>
							<div class="form-field">
								<label for="signal" class="label social-label">
									<span class="social-icon-label">sg</span>
									Signal
								</label>
								<input
									id="signal"
									type="tel"
									bind:value={signal}
									class="input"
									placeholder="+49..."
								/>
							</div>
							<div class="form-field">
								<label for="discord" class="label social-label">
									<span class="social-icon-label">dc</span>
									Discord
								</label>
								<input
									id="discord"
									type="text"
									bind:value={discord}
									class="input"
									placeholder="username#1234"
								/>
							</div>
							<div class="form-field">
								<label for="bluesky" class="label social-label">
									<span class="social-icon-label">bs</span>
									Bluesky
								</label>
								<input
									id="bluesky"
									type="text"
									bind:value={bluesky}
									class="input"
									placeholder="@handle.bsky.social"
								/>
							</div>
						</div>
					{/if}
				</section>

				<!-- Action Buttons -->
				<div class="actions">
					<button type="button" onclick={onClose} class="btn btn-secondary"> Abbrechen </button>
					<button type="submit" disabled={saving} class="btn btn-primary">
						{#if saving}
							<svg class="spinner" viewBox="0 0 24 24" fill="none">
								<circle
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="3"
									stroke-opacity="0.25"
								/>
								<path
									d="M12 2a10 10 0 0 1 10 10"
									stroke="currentColor"
									stroke-width="3"
									stroke-linecap="round"
								/>
							</svg>
							<span>Speichern...</span>
						{:else}
							<svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								/>
							</svg>
							<span>Kontakt erstellen</span>
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
</div>

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}

	.modal-container {
		background: hsl(var(--color-background));
		border-radius: 1.5rem;
		width: 100%;
		max-width: 560px;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
		animation: modalIn 0.2s ease-out;
	}

	@keyframes modalIn {
		from {
			opacity: 0;
			transform: scale(0.95) translateY(10px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	.modal-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid hsl(var(--color-border));
		flex-shrink: 0;
	}

	.modal-body {
		flex: 1;
		overflow-y: auto;
		padding: 0 1.5rem 1.5rem;
	}

	.back-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.back-button:hover {
		background: hsl(var(--color-surface-hover));
	}

	.title {
		flex: 1;
		font-size: 1.25rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
	}

	.header-spacer {
		width: 2.5rem;
	}

	.error-banner {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: hsl(var(--color-error) / 0.1);
		border: 1px solid hsl(var(--color-error) / 0.3);
		border-radius: 0.75rem;
		color: hsl(var(--color-error));
		margin-bottom: 1rem;
		margin-top: 1rem;
	}

	.avatar-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1.5rem 0;
	}

	.hidden-file-input {
		display: none;
	}

	.avatar-wrapper {
		position: relative;
		margin-bottom: 1rem;
	}

	.avatar-button {
		position: relative;
		width: 100px;
		height: 100px;
		border-radius: 50%;
		border: none;
		padding: 0;
		cursor: pointer;
		overflow: hidden;
		background: transparent;
	}

	.avatar-circle {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		background: linear-gradient(
			135deg,
			hsl(var(--color-primary)) 0%,
			hsl(var(--color-primary) / 0.7) 100%
		);
		color: hsl(var(--color-primary-foreground));
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2.5rem;
		font-weight: 700;
		box-shadow: 0 8px 24px hsl(var(--color-primary) / 0.3);
		position: relative;
	}

	.avatar-circle.empty {
		background: hsl(var(--color-muted));
		box-shadow: 0 4px 12px hsl(var(--color-foreground) / 0.1);
		border: 2px dashed hsl(var(--color-border));
	}

	.avatar-button:hover .avatar-circle.empty {
		border-color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.1);
	}

	.add-photo-icon {
		width: 40px;
		height: 40px;
		color: hsl(var(--color-muted-foreground));
		transition: color 0.2s ease;
	}

	.avatar-button:hover .add-photo-icon {
		color: hsl(var(--color-primary));
	}

	.avatar-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 50%;
	}

	.avatar-overlay {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.avatar-button:hover .avatar-overlay {
		opacity: 1;
	}

	.camera-icon {
		width: 28px;
		height: 28px;
		color: white;
	}

	.remove-photo-btn {
		position: absolute;
		top: -4px;
		right: -4px;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: hsl(var(--color-error));
		color: white;
		border: 2px solid hsl(var(--color-background));
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		transition: transform 0.2s ease;
	}

	.remove-photo-btn:hover {
		transform: scale(1.1);
	}

	.remove-photo-btn svg {
		width: 14px;
		height: 14px;
	}

	.preview-name {
		font-size: 1.125rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		text-align: center;
	}

	.preview-subtitle {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		text-align: center;
		margin-top: 0.25rem;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-section {
		background: hsl(var(--color-surface));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.875rem;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding-bottom: 0.625rem;
		border-bottom: 1px solid hsl(var(--color-border) / 0.5);
		margin-bottom: 0.25rem;
	}

	.section-icon {
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 0.375rem;
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.section-icon svg {
		width: 1rem;
		height: 1rem;
	}

	.section-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.label {
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
	}

	.input {
		width: 100%;
		padding: 0.625rem 0.875rem;
		border: 1.5px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-input));
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
		transition: all 0.2s ease;
	}

	.input:focus {
		outline: none;
		border-color: hsl(var(--color-primary));
		box-shadow: 0 0 0 3px hsl(var(--color-primary) / 0.1);
	}

	.input::placeholder {
		color: hsl(var(--color-muted-foreground) / 0.6);
	}

	.textarea {
		resize: none;
		min-height: 80px;
	}

	.actions {
		display: flex;
		gap: 0.75rem;
		padding-top: 0.5rem;
	}

	.btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		border-radius: 0.625rem;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
	}

	.btn-primary {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		box-shadow: 0 4px 12px hsl(var(--color-primary) / 0.3);
	}

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 6px 16px hsl(var(--color-primary) / 0.4);
	}

	.btn-primary:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.btn-secondary {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}

	.btn-secondary:hover {
		background: hsl(var(--color-surface-hover));
	}

	.icon {
		width: 1.25rem;
		height: 1.25rem;
	}

	.icon-sm {
		width: 1rem;
		height: 1rem;
	}

	.spinner {
		width: 1.25rem;
		height: 1.25rem;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 480px) {
		.modal-container {
			max-height: 95vh;
			border-radius: 1rem 1rem 0 0;
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			max-width: 100%;
		}

		.modal-backdrop {
			padding: 0;
			align-items: flex-end;
		}

		.form-grid {
			grid-template-columns: 1fr;
		}

		.actions {
			flex-direction: column-reverse;
		}

		.social-grid {
			grid-template-columns: 1fr;
		}
	}

	/* Social Media Section */
	.section-header-toggle {
		width: 100%;
		background: none;
		border: none;
		cursor: pointer;
		border-bottom: 1px solid hsl(var(--color-border) / 0.5);
		margin-bottom: 0;
	}

	.section-header-toggle:hover {
		background: hsl(var(--color-surface-hover) / 0.3);
		margin: 0 -1rem;
		padding: 0 1rem 0.625rem;
		width: calc(100% + 2rem);
		border-radius: 0.5rem 0.5rem 0 0;
	}

	.chevron-icon {
		width: 1rem;
		height: 1rem;
		margin-left: auto;
		color: hsl(var(--color-muted-foreground));
		transition: transform 0.2s ease;
	}

	.chevron-open {
		transform: rotate(180deg);
	}

	.social-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
		padding-top: 0.75rem;
	}

	.social-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.social-icon-label {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 0.25rem;
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
		font-size: 0.625rem;
		font-weight: 700;
		text-transform: lowercase;
	}
</style>
