<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { contactsApi, type Contact } from '$lib/api/contacts';
	import '$lib/i18n';

	let contact = $state<Contact | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let editing = $state(false);
	let saving = $state(false);
	let deleting = $state(false);

	// Edit form state
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

	const contactId = $derived($page.params.id);

	const initials = $derived(() => {
		if (!contact) return '?';
		const f = contact.firstName?.[0] || '';
		const l = contact.lastName?.[0] || '';
		return (f + l).toUpperCase() || contact.email?.[0]?.toUpperCase() || '?';
	});

	const editInitials = $derived(() => {
		const f = firstName?.[0] || '';
		const l = lastName?.[0] || '';
		return (f + l).toUpperCase() || '?';
	});

	const editDisplayName = $derived(() => {
		if (firstName || lastName) {
			return [firstName, lastName].filter(Boolean).join(' ');
		}
		return email || 'Kontakt';
	});

	function populateForm() {
		if (!contact) return;
		firstName = contact.firstName || '';
		lastName = contact.lastName || '';
		email = contact.email || '';
		phone = contact.phone || '';
		mobile = contact.mobile || '';
		company = contact.company || '';
		jobTitle = contact.jobTitle || '';
		street = contact.street || '';
		city = contact.city || '';
		postalCode = contact.postalCode || '';
		country = contact.country || '';
		notes = contact.notes || '';
	}

	function getDisplayName() {
		if (!contact) return '';
		if (contact.displayName) return contact.displayName;
		if (contact.firstName || contact.lastName) {
			return [contact.firstName, contact.lastName].filter(Boolean).join(' ');
		}
		return contact.email || 'Unbekannt';
	}

	async function loadContact() {
		loading = true;
		error = null;
		try {
			contact = await contactsApi.get(contactId);
			populateForm();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Laden des Kontakts';
		} finally {
			loading = false;
		}
	}

	async function handleSave() {
		saving = true;
		error = null;
		try {
			contact = await contactsApi.update(contactId, {
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
			});
			editing = false;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Speichern';
		} finally {
			saving = false;
		}
	}

	async function handleDelete() {
		if (!confirm('Kontakt wirklich löschen?')) return;
		deleting = true;
		try {
			await contactsApi.delete(contactId);
			goto('/');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Löschen';
			deleting = false;
		}
	}

	async function handleToggleFavorite() {
		if (!contact) return;
		try {
			contact = await contactsApi.toggleFavorite(contactId);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler';
		}
	}

	onMount(() => {
		loadContact();
	});
</script>

<svelte:head>
	<title>{contact ? getDisplayName() : 'Kontakt'} - Contacts</title>
</svelte:head>

<div class="page-container">
	<!-- Header -->
	<header class="header">
		<a href="/" class="back-button" aria-label="Zurück">
			<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</a>
		<h1 class="title">{editing ? 'Bearbeiten' : 'Kontakt'}</h1>
		{#if contact && !editing && !loading}
			<div class="header-actions">
				<button onclick={() => { editing = true; populateForm(); }} class="action-btn" aria-label="Bearbeiten">
					<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
					</svg>
				</button>
				<button onclick={handleDelete} disabled={deleting} class="action-btn action-btn-danger" aria-label="Löschen">
					<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
					</svg>
				</button>
			</div>
		{:else}
			<div class="header-spacer"></div>
		{/if}
	</header>

	{#if loading}
		<div class="loading-container">
			<svg class="spinner-lg" viewBox="0 0 24 24" fill="none">
				<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-opacity="0.25" />
				<path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
			</svg>
			<p class="loading-text">Lade Kontakt...</p>
		</div>
	{:else if error && !contact}
		<div class="error-container">
			<div class="error-icon-wrapper">
				<svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
			</div>
			<p class="error-text">{error}</p>
			<a href="/" class="btn btn-secondary">Zurück zur Liste</a>
		</div>
	{:else if contact}
		{#if error}
			<div class="error-banner" role="alert">
				<svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
				<span>{error}</span>
			</div>
		{/if}

		{#if editing}
			<!-- Edit Mode -->
			<!-- Avatar Preview -->
			<div class="avatar-section">
				<div class="avatar-wrapper">
					<div class="avatar-circle">
						{editInitials()}
					</div>
					<button type="button" class="avatar-edit-btn" aria-label="Foto ändern">
						<svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
					</button>
				</div>
				<p class="preview-name">{editDisplayName()}</p>
				{#if company || jobTitle}
					<p class="preview-subtitle">{[jobTitle, company].filter(Boolean).join(' bei ')}</p>
				{/if}
			</div>

			<form onsubmit={(e) => { e.preventDefault(); handleSave(); }} class="form">
				<!-- Name Section -->
				<section class="form-section">
					<div class="section-header">
						<div class="section-icon">
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
							</svg>
						</div>
						<h2 class="section-title">Name</h2>
					</div>
					<div class="form-grid">
						<div class="form-field">
							<label for="firstName" class="label">Vorname</label>
							<input id="firstName" type="text" bind:value={firstName} class="input" />
						</div>
						<div class="form-field">
							<label for="lastName" class="label">Nachname</label>
							<input id="lastName" type="text" bind:value={lastName} class="input" />
						</div>
					</div>
				</section>

				<!-- Contact Section -->
				<section class="form-section">
					<div class="section-header">
						<div class="section-icon">
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
							</svg>
						</div>
						<h2 class="section-title">Kontakt</h2>
					</div>
					<div class="form-field">
						<label for="email" class="label">E-Mail</label>
						<div class="input-with-icon">
							<svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
							</svg>
							<input id="email" type="email" bind:value={email} class="input input-padded" />
						</div>
					</div>
					<div class="form-grid">
						<div class="form-field">
							<label for="phone" class="label">Telefon</label>
							<div class="input-with-icon">
								<svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
								</svg>
								<input id="phone" type="tel" bind:value={phone} class="input input-padded" />
							</div>
						</div>
						<div class="form-field">
							<label for="mobile" class="label">Mobil</label>
							<div class="input-with-icon">
								<svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
								</svg>
								<input id="mobile" type="tel" bind:value={mobile} class="input input-padded" />
							</div>
						</div>
					</div>
				</section>

				<!-- Work Section -->
				<section class="form-section">
					<div class="section-header">
						<div class="section-icon">
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
							</svg>
						</div>
						<h2 class="section-title">Arbeit</h2>
					</div>
					<div class="form-field">
						<label for="company" class="label">Firma</label>
						<input id="company" type="text" bind:value={company} class="input" />
					</div>
					<div class="form-field">
						<label for="jobTitle" class="label">Position</label>
						<input id="jobTitle" type="text" bind:value={jobTitle} class="input" />
					</div>
				</section>

				<!-- Address Section -->
				<section class="form-section">
					<div class="section-header">
						<div class="section-icon">
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
						</div>
						<h2 class="section-title">Adresse</h2>
					</div>
					<div class="form-field">
						<label for="street" class="label">Straße & Hausnummer</label>
						<input id="street" type="text" bind:value={street} class="input" />
					</div>
					<div class="form-grid form-grid-3">
						<div class="form-field">
							<label for="postalCode" class="label">PLZ</label>
							<input id="postalCode" type="text" bind:value={postalCode} class="input" />
						</div>
						<div class="form-field col-span-2">
							<label for="city" class="label">Stadt</label>
							<input id="city" type="text" bind:value={city} class="input" />
						</div>
					</div>
					<div class="form-field">
						<label for="country" class="label">Land</label>
						<input id="country" type="text" bind:value={country} class="input" />
					</div>
				</section>

				<!-- Notes Section -->
				<section class="form-section">
					<div class="section-header">
						<div class="section-icon">
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
							</svg>
						</div>
						<h2 class="section-title">Notizen</h2>
					</div>
					<textarea bind:value={notes} rows="4" class="input textarea"></textarea>
				</section>

				<!-- Action Buttons -->
				<div class="actions">
					<button type="button" onclick={() => { editing = false; }} class="btn btn-secondary">
						Abbrechen
					</button>
					<button type="submit" disabled={saving} class="btn btn-primary">
						{#if saving}
							<svg class="spinner" viewBox="0 0 24 24" fill="none">
								<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-opacity="0.25" />
								<path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
							</svg>
							<span>Speichern...</span>
						{:else}
							<svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
							<span>Speichern</span>
						{/if}
					</button>
				</div>
			</form>
		{:else}
			<!-- View Mode -->
			<!-- Avatar & Profile Header -->
			<div class="profile-header">
				<div class="avatar-wrapper">
					<div class="avatar-circle avatar-large">
						{initials()}
					</div>
					<button onclick={handleToggleFavorite} class="favorite-btn" aria-label={contact.isFavorite ? 'Von Favoriten entfernen' : 'Zu Favoriten hinzufügen'}>
						{#if contact.isFavorite}
							<svg class="favorite-icon favorite-active" viewBox="0 0 24 24">
								<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
							</svg>
						{:else}
							<svg class="favorite-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
							</svg>
						{/if}
					</button>
				</div>
				<h2 class="profile-name">{getDisplayName()}</h2>
				{#if contact.company || contact.jobTitle}
					<p class="profile-subtitle">
						{[contact.jobTitle, contact.company].filter(Boolean).join(' @ ')}
					</p>
				{/if}
			</div>

			<!-- Quick Actions -->
			<div class="quick-actions">
				{#if contact.phone}
					<a href="tel:{contact.phone}" class="quick-action">
						<div class="quick-action-icon">
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
							</svg>
						</div>
						<span>Anrufen</span>
					</a>
				{/if}
				{#if contact.email}
					<a href="mailto:{contact.email}" class="quick-action">
						<div class="quick-action-icon">
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
							</svg>
						</div>
						<span>E-Mail</span>
					</a>
				{/if}
				{#if contact.mobile}
					<a href="sms:{contact.mobile}" class="quick-action">
						<div class="quick-action-icon">
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
							</svg>
						</div>
						<span>Nachricht</span>
					</a>
				{/if}
			</div>

			<!-- Contact Details -->
			<div class="details-container">
				<!-- Contact Info -->
				{#if contact.email || contact.phone || contact.mobile}
					<section class="detail-section">
						<div class="section-header">
							<div class="section-icon">
								<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
								</svg>
							</div>
							<h3 class="section-title">Kontakt</h3>
						</div>
						<div class="detail-list">
							{#if contact.email}
								<a href="mailto:{contact.email}" class="detail-item detail-link">
									<svg class="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
									</svg>
									<div class="detail-content">
										<span class="detail-label">E-Mail</span>
										<span class="detail-value">{contact.email}</span>
									</div>
								</a>
							{/if}
							{#if contact.phone}
								<a href="tel:{contact.phone}" class="detail-item detail-link">
									<svg class="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
									</svg>
									<div class="detail-content">
										<span class="detail-label">Telefon</span>
										<span class="detail-value">{contact.phone}</span>
									</div>
								</a>
							{/if}
							{#if contact.mobile}
								<a href="tel:{contact.mobile}" class="detail-item detail-link">
									<svg class="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
									</svg>
									<div class="detail-content">
										<span class="detail-label">Mobil</span>
										<span class="detail-value">{contact.mobile}</span>
									</div>
								</a>
							{/if}
						</div>
					</section>
				{/if}

				<!-- Work Info -->
				{#if contact.company || contact.jobTitle}
					<section class="detail-section">
						<div class="section-header">
							<div class="section-icon">
								<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
								</svg>
							</div>
							<h3 class="section-title">Arbeit</h3>
						</div>
						<div class="detail-list">
							{#if contact.company}
								<div class="detail-item">
									<svg class="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
									</svg>
									<div class="detail-content">
										<span class="detail-label">Firma</span>
										<span class="detail-value">{contact.company}</span>
									</div>
								</div>
							{/if}
							{#if contact.jobTitle}
								<div class="detail-item">
									<svg class="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
									</svg>
									<div class="detail-content">
										<span class="detail-label">Position</span>
										<span class="detail-value">{contact.jobTitle}</span>
									</div>
								</div>
							{/if}
						</div>
					</section>
				{/if}

				<!-- Address -->
				{#if contact.street || contact.city || contact.postalCode || contact.country}
					<section class="detail-section">
						<div class="section-header">
							<div class="section-icon">
								<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
								</svg>
							</div>
							<h3 class="section-title">Adresse</h3>
						</div>
						<div class="address-card">
							{#if contact.street}<div class="address-line">{contact.street}</div>{/if}
							{#if contact.postalCode || contact.city}
								<div class="address-line">{[contact.postalCode, contact.city].filter(Boolean).join(' ')}</div>
							{/if}
							{#if contact.country}<div class="address-line">{contact.country}</div>{/if}
						</div>
					</section>
				{/if}

				<!-- Notes -->
				{#if contact.notes}
					<section class="detail-section">
						<div class="section-header">
							<div class="section-icon">
								<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
								</svg>
							</div>
							<h3 class="section-title">Notizen</h3>
						</div>
						<div class="notes-content">
							{contact.notes}
						</div>
					</section>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<style>
	.page-container {
		max-width: 640px;
		margin: 0 auto;
		padding: 0 1rem 2rem;
	}

	/* Header */
	.header {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 0;
		position: sticky;
		top: 0;
		background: hsl(var(--color-background));
		z-index: 10;
		margin-bottom: 0.5rem;
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
		transition: all 0.2s ease;
	}

	.back-button:hover {
		background: hsl(var(--color-surface-hover));
		transform: translateX(-2px);
	}

	.title {
		flex: 1;
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
	}

	.header-spacer {
		width: 2.5rem;
	}

	.header-actions {
		display: flex;
		gap: 0.5rem;
	}

	.action-btn {
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

	.action-btn:hover {
		background: hsl(var(--color-surface-hover));
	}

	.action-btn-danger:hover {
		background: hsl(var(--color-error) / 0.15);
		color: hsl(var(--color-error));
	}

	/* Loading */
	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		gap: 1rem;
	}

	.spinner-lg {
		width: 3rem;
		height: 3rem;
		color: hsl(var(--color-primary));
		animation: spin 1s linear infinite;
	}

	.loading-text {
		color: hsl(var(--color-muted-foreground));
		font-size: 0.9375rem;
	}

	/* Error */
	.error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 4rem 2rem;
		gap: 1.5rem;
	}

	.error-icon-wrapper {
		width: 4rem;
		height: 4rem;
		border-radius: 50%;
		background: hsl(var(--color-error) / 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.error-icon {
		width: 2rem;
		height: 2rem;
		color: hsl(var(--color-error));
	}

	.error-text {
		color: hsl(var(--color-foreground));
		font-size: 1rem;
		text-align: center;
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
		margin-bottom: 1.5rem;
	}

	/* Profile Header */
	.profile-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1.5rem 0 2rem;
	}

	.avatar-wrapper {
		position: relative;
		margin-bottom: 1rem;
	}

	.avatar-circle {
		width: 100px;
		height: 100px;
		border-radius: 50%;
		background: linear-gradient(135deg, hsl(var(--color-primary)) 0%, hsl(var(--color-primary) / 0.7) 100%);
		color: hsl(var(--color-primary-foreground));
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2.5rem;
		font-weight: 700;
		box-shadow: 0 8px 24px hsl(var(--color-primary) / 0.3);
	}

	.avatar-large {
		width: 120px;
		height: 120px;
		font-size: 3rem;
	}

	.avatar-edit-btn {
		position: absolute;
		bottom: 0;
		right: 0;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: hsl(var(--color-surface));
		border: 2px solid hsl(var(--color-background));
		color: hsl(var(--color-muted-foreground));
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.avatar-edit-btn:hover {
		background: hsl(var(--color-surface-hover));
		color: hsl(var(--color-foreground));
	}

	.favorite-btn {
		position: absolute;
		bottom: -4px;
		right: -4px;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: hsl(var(--color-surface));
		border: 2px solid hsl(var(--color-background));
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 2px 8px hsl(var(--color-foreground) / 0.1);
	}

	.favorite-btn:hover {
		transform: scale(1.1);
	}

	.favorite-icon {
		width: 1.25rem;
		height: 1.25rem;
		color: hsl(var(--color-muted-foreground));
	}

	.favorite-active {
		fill: hsl(var(--color-error));
		color: hsl(var(--color-error));
	}

	.profile-name {
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
		text-align: center;
	}

	.profile-subtitle {
		font-size: 0.9375rem;
		color: hsl(var(--color-muted-foreground));
		text-align: center;
		margin-top: 0.25rem;
	}

	.preview-name {
		font-size: 1.25rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		text-align: center;
	}

	.preview-subtitle {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		text-align: center;
		margin-top: 0.25rem;
	}

	/* Avatar Section for Edit Mode */
	.avatar-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1.5rem 0 2rem;
	}

	/* Quick Actions */
	.quick-actions {
		display: flex;
		justify-content: center;
		gap: 2rem;
		padding-bottom: 1.5rem;
		margin-bottom: 0.5rem;
		border-bottom: 1px solid hsl(var(--color-border));
	}

	.quick-action {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		color: hsl(var(--color-primary));
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.quick-action:hover {
		transform: translateY(-2px);
	}

	.quick-action-icon {
		width: 3rem;
		height: 3rem;
		border-radius: 50%;
		background: hsl(var(--color-primary) / 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.quick-action-icon svg {
		width: 1.25rem;
		height: 1.25rem;
	}

	.quick-action span {
		font-size: 0.75rem;
		font-weight: 500;
	}

	/* Details Container */
	.details-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	/* Detail Section */
	.detail-section {
		background: hsl(var(--color-surface));
		border: 1px solid hsl(var(--color-border));
		border-radius: 1rem;
		padding: 1.25rem;
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid hsl(var(--color-border) / 0.5);
		margin-bottom: 0.75rem;
	}

	.section-icon {
		width: 2rem;
		height: 2rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.section-icon svg {
		width: 1.125rem;
		height: 1.125rem;
	}

	.section-title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}

	/* Detail List */
	.detail-list {
		display: flex;
		flex-direction: column;
	}

	.detail-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid hsl(var(--color-border) / 0.3);
	}

	.detail-item:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.detail-item:first-child {
		padding-top: 0;
	}

	.detail-link {
		text-decoration: none;
		color: inherit;
		transition: all 0.2s ease;
	}

	.detail-link:hover {
		background: hsl(var(--color-surface-hover) / 0.5);
		margin: 0 -0.5rem;
		padding-left: 0.5rem;
		padding-right: 0.5rem;
		border-radius: 0.5rem;
	}

	.detail-icon {
		width: 1.25rem;
		height: 1.25rem;
		color: hsl(var(--color-muted-foreground));
		flex-shrink: 0;
	}

	.detail-content {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.detail-label {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.detail-value {
		font-size: 0.9375rem;
		color: hsl(var(--color-foreground));
	}

	.detail-link:hover .detail-value {
		color: hsl(var(--color-primary));
	}

	/* Address Card */
	.address-card {
		padding: 0.75rem 1rem;
		background: hsl(var(--color-muted) / 0.5);
		border-radius: 0.5rem;
	}

	.address-line {
		font-size: 0.9375rem;
		color: hsl(var(--color-foreground));
		line-height: 1.5;
	}

	/* Notes */
	.notes-content {
		font-size: 0.9375rem;
		color: hsl(var(--color-foreground));
		white-space: pre-wrap;
		line-height: 1.6;
	}

	/* Form */
	.form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	/* Form Section */
	.form-section {
		background: hsl(var(--color-surface));
		border: 1px solid hsl(var(--color-border));
		border-radius: 1rem;
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	/* Form Fields */
	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.form-grid-3 {
		grid-template-columns: 1fr 2fr;
	}

	.col-span-2 {
		grid-column: span 2 / span 2;
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
	}

	.input {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1.5px solid hsl(var(--color-border));
		border-radius: 0.625rem;
		background: hsl(var(--color-input));
		color: hsl(var(--color-foreground));
		font-size: 0.9375rem;
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

	.input-with-icon {
		position: relative;
	}

	.input-icon {
		position: absolute;
		left: 0.875rem;
		top: 50%;
		transform: translateY(-50%);
		width: 1.125rem;
		height: 1.125rem;
		color: hsl(var(--color-muted-foreground));
		pointer-events: none;
	}

	.input-padded {
		padding-left: 2.75rem;
	}

	.textarea {
		resize: none;
		min-height: 100px;
	}

	/* Action Buttons */
	.actions {
		display: flex;
		gap: 1rem;
		padding-top: 0.5rem;
	}

	.btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.875rem 1.5rem;
		border-radius: 0.75rem;
		font-weight: 600;
		font-size: 0.9375rem;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
		text-decoration: none;
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

	/* Icons */
	.icon {
		width: 1.25rem;
		height: 1.25rem;
	}

	.icon-sm {
		width: 1rem;
		height: 1rem;
	}

	/* Spinner */
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

	/* Responsive */
	@media (max-width: 480px) {
		.form-grid {
			grid-template-columns: 1fr;
		}

		.form-grid-3 {
			grid-template-columns: 1fr;
		}

		.col-span-2 {
			grid-column: span 1;
		}

		.actions {
			flex-direction: column-reverse;
		}

		.quick-actions {
			gap: 1.5rem;
		}

		.quick-action-icon {
			width: 2.5rem;
			height: 2.5rem;
		}

		.quick-action-icon svg {
			width: 1rem;
			height: 1rem;
		}
	}
</style>
