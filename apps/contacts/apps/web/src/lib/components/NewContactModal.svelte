<script lang="ts">
	import { onMount } from 'svelte';
	import { contactsApi, photoApi } from '$lib/api/contacts';
	import { authStore } from '$lib/stores/auth.svelte';
	import { newContactModalStore } from '$lib/stores/new-contact-modal.svelte';
	import SocialMediaFields from './forms/SocialMediaFields.svelte';
	import DateFields from './forms/DateFields.svelte';
	import { parseContactInput, formatParsedContactPreview } from '$lib/utils/contact-parser';
	import { findDuplicates, type DuplicateMatch } from '$lib/utils/duplicate-detector';
	import { contactCollection } from '$lib/data/local-store';
	import {
		X,
		Warning,
		Camera,
		User,
		Envelope,
		Briefcase,
		MapPin,
		PencilSimple,
		Check,
	} from '@manacore/shared-icons';

	interface Props {
		onClose: () => void;
		onSuccess?: () => void;
	}

	let { onClose, onSuccess }: Props = $props();

	let saving = $state(false);
	let error = $state<string | null>(null);
	let firstNameInput: HTMLInputElement;
	let quickInputRef: HTMLInputElement;
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

	// Dates
	let birthday = $state('');
	let customDates = $state<Array<{ id: string; label: string; date: string }>>([]);

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

	// ─── Quick Input (NL Parser) ───────────────────────────
	let quickInput = $state('');
	let quickPreview = $state('');
	let quickApplied = $state(false);

	function handleQuickInput(e: Event) {
		const text = (e.target as HTMLInputElement).value;
		quickInput = text;
		quickApplied = false;

		if (!text.trim()) {
			quickPreview = '';
			return;
		}

		const parsed = parseContactInput(text);
		quickPreview = formatParsedContactPreview(parsed);
	}

	function applyQuickInput() {
		if (!quickInput.trim() || quickApplied) return;

		const parsed = parseContactInput(quickInput);

		if (parsed.firstName) firstName = parsed.firstName;
		if (parsed.lastName) lastName = parsed.lastName;
		if (parsed.email) email = parsed.email;
		if (parsed.phone) phone = parsed.phone;
		if (parsed.company) company = parsed.company;

		quickApplied = true;
		quickInput = '';
		quickPreview = '';
	}

	function handleQuickKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			applyQuickInput();
			// Move focus to first name field
			firstNameInput?.focus();
		}
	}

	// ─── Live Duplicate Detection ──────────────────────────
	let duplicates = $state<DuplicateMatch[]>([]);
	let dupDebounce: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		// Watch for changes in name or email fields
		const fn = firstName;
		const ln = lastName;
		const em = email;

		clearTimeout(dupDebounce);
		if (fn || ln || em) {
			dupDebounce = setTimeout(() => checkDuplicates(fn, ln, em), 300);
		} else {
			duplicates = [];
		}
	});

	async function checkDuplicates(fn: string, ln: string, em: string) {
		try {
			const allContacts = await contactCollection.getAll();
			duplicates = findDuplicates(
				{ firstName: fn, lastName: ln, email: em },
				allContacts.map((c) => ({
					id: c.id,
					firstName: c.firstName,
					lastName: c.lastName,
					email: c.email,
					company: c.company,
				}))
			);
		} catch {
			duplicates = [];
		}
	}

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
		// Demo mode: show auth gate
		if (!authStore.isAuthenticated) {
			window.dispatchEvent(new CustomEvent('show-auth-gate'));
			return;
		}

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
				// Dates
				birthday: birthday || null,
				customDates: customDates.filter((d) => d.label && d.date),
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

			// Live query auto-updates — no manual reload needed
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
				<X size={24} class="icon" />
			</button>
			<h1 id="modal-title" class="title">Neuer Kontakt</h1>
			<div class="header-spacer"></div>
		</header>

		<!-- Modal Body -->
		<div class="modal-body">
			<!-- Quick Input Bar -->
			<div class="quick-input-section">
				<input
					type="text"
					class="quick-input"
					bind:this={quickInputRef}
					value={quickInput}
					oninput={handleQuickInput}
					onkeydown={handleQuickKeydown}
					placeholder="Schnelleingabe: Max Müller @Firma max@mail.de +49... #tag"
				/>
				{#if quickPreview}
					<div class="quick-preview">{quickPreview}</div>
				{/if}
			</div>

			<!-- Duplicate Warning -->
			{#if duplicates.length > 0}
				<div class="duplicate-warning" role="alert">
					<Warning size={20} class="icon-sm" />
					<div class="duplicate-info">
						<span class="duplicate-label">Mögliches Duplikat:</span>
						{#each duplicates.slice(0, 3) as dup}
							<span class="duplicate-name">
								{dup.displayName}
								<span class="duplicate-field"
									>({dup.matchField === 'email' ? 'E-Mail' : 'Name'})</span
								>
							</span>
						{/each}
					</div>
				</div>
			{/if}

			{#if error}
				<div class="error-banner" role="alert">
					<Warning size={20} class="icon-sm" />
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
								<Camera size={24} class="camera-icon" />
							</div>
						{:else}
							<div class="avatar-circle empty">
								<Camera size={24} class="add-photo-icon" />
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
							<X size={16} />
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
							<User size={20} />
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
							<Envelope size={20} />
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
							<Briefcase size={20} />
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
							<MapPin size={20} />
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
							<PencilSimple size={20} />
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

				<!-- Dates Section -->
				<DateFields bind:birthday bind:customDates />

				<!-- Social Media Section -->
				<SocialMediaFields
					bind:linkedin
					bind:twitter
					bind:facebook
					bind:instagram
					bind:xing
					bind:github
					bind:youtube
					bind:tiktok
					bind:telegram
					bind:whatsapp
					bind:signal
					bind:discord
					bind:bluesky
				/>

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
							<Check size={20} class="icon-sm" />
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

	.quick-input-section {
		margin-bottom: 1rem;
	}

	.quick-input {
		width: 100%;
		padding: 0.625rem 0.875rem;
		border: 1px dashed hsl(var(--color-border));
		border-radius: 0.75rem;
		background: hsl(var(--color-muted) / 0.3);
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		outline: none;
		transition: all 0.15s;
	}

	.quick-input:focus {
		border-style: solid;
		border-color: hsl(var(--color-primary) / 0.5);
		background: hsl(var(--color-background));
		box-shadow: 0 0 0 3px hsl(var(--color-primary) / 0.1);
	}

	.quick-input::placeholder {
		color: hsl(var(--color-muted-foreground));
		font-size: 0.75rem;
	}

	.quick-preview {
		margin-top: 0.25rem;
		padding: 0 0.5rem;
		font-size: 0.7rem;
		color: hsl(var(--color-muted-foreground));
	}

	.duplicate-warning {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.625rem 0.875rem;
		margin-bottom: 0.75rem;
		border-radius: 0.75rem;
		background: hsl(35 100% 95%);
		color: hsl(25 80% 40%);
		font-size: 0.8125rem;
	}

	:global(.dark) .duplicate-warning {
		background: hsl(35 60% 15%);
		color: hsl(35 90% 75%);
	}

	.duplicate-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.duplicate-label {
		font-weight: 600;
		font-size: 0.75rem;
	}

	.duplicate-name {
		font-size: 0.8125rem;
	}

	.duplicate-field {
		font-size: 0.7rem;
		opacity: 0.7;
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
	}
</style>
