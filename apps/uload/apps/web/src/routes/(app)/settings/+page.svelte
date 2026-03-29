<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { toastMessages, notify } from '$lib/services/toast';
	import * as m from '$paraglide/messages';
	import {
		SettingsPage,
		SettingsSection,
		SettingsCard,
		SettingsRow,
		SettingsDangerZone,
		SettingsDangerButton,
	} from '@manacore/shared-ui';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let isSubmitting = $state(false);
	let showDeleteConfirm = $state(false);
	let deleteConfirmText = $state('');

	function formatUrl(username: string) {
		if (typeof window === 'undefined') return '';
		return `${window.location.origin}/p/${username}`;
	}

	function setCardColors(bg: string, border: string, links: string, text: string) {
		const bgInput = document.getElementById('cardBackground') as HTMLInputElement;
		const borderInput = document.getElementById('cardBorder') as HTMLInputElement;
		const linksInput = document.getElementById('cardLinks') as HTMLInputElement;
		const textInput = document.getElementById('cardText') as HTMLInputElement;

		if (bgInput) bgInput.value = bg;
		if (borderInput) borderInput.value = border;
		if (linksInput) linksInput.value = links;
		if (textInput) textInput.value = text;
	}
</script>

<SettingsPage title="Settings" subtitle="Manage your account and preferences" maxWidth="3xl">
	<div class="space-y-6">
		<!-- Profile Section -->
		<div class="rounded-xl bg-white p-6 shadow-xl dark:bg-theme-surface">
			<h2 class="mb-6 text-xl font-semibold text-theme-text dark:text-white">
				Profile Information
			</h2>

			<form
				method="POST"
				action="?/updateProfile"
				enctype="multipart/form-data"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ result, update }) => {
						if (result.type === 'success') {
							toastMessages.profileUpdated();
						} else if (result.type === 'failure' && result.data?.error) {
							notify.error(m.error_save(), result.data.error);
						}
						await update();
						isSubmitting = false;
					};
				}}
			>
				<div class="space-y-4">
					<!-- Avatar Upload Section -->
					<div>
						<label
							for="avatar"
							class="mb-1 block text-sm font-medium text-theme-text dark:text-theme-text"
						>
							Profile Picture
						</label>
						<div class="flex items-center space-x-4">
							{#if data.avatarUrl}
								<img
									src={data.avatarUrl}
									alt="Profile"
									class="h-20 w-20 rounded-full object-cover"
								/>
							{:else}
								<div
									class="flex h-20 w-20 items-center justify-center rounded-full bg-theme-surface"
								>
									<span class="text-2xl font-semibold text-theme-text-muted">
										{(data.user?.name || data.user?.username || 'U').charAt(0).toUpperCase()}
									</span>
								</div>
							{/if}
							<div>
								<input
									type="file"
									id="avatar"
									name="avatar"
									accept="image/*"
									class="block w-full text-sm text-theme-text file:mr-4 file:rounded-full file:border-0 file:bg-theme-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-theme-primary-hover"
								/>
								<p class="mt-1 text-xs text-theme-text-muted">JPG, PNG oder GIF. Max 5MB.</p>
							</div>
						</div>
					</div>

					<div>
						<label
							for="username"
							class="mb-1 block text-sm font-medium text-theme-text dark:text-theme-text"
						>
							Username
						</label>
						<input
							type="text"
							id="username"
							name="username"
							value={data.user?.username || ''}
							disabled
							readonly
							class="w-full cursor-not-allowed rounded-md border border-theme-border bg-gray-100 px-3 py-2 text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
						/>
						{#if data.user?.username}
							<p class="mt-1 text-xs text-theme-text-muted dark:text-theme-text-muted">
								Profile URL: {formatUrl(data.user.username)} • Username kann nicht geändert werden
							</p>
						{/if}
					</div>

					<div>
						<label
							for="name"
							class="mb-1 block text-sm font-medium text-theme-text dark:text-theme-text"
						>
							Display Name
						</label>
						<input
							type="text"
							id="name"
							name="name"
							value={data.user?.name || ''}
							placeholder="John Doe"
							class="w-full rounded-md border border-theme-border bg-theme-surface px-3 py-2 text-theme-text placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
						/>
					</div>

					<div>
						<label
							for="email"
							class="mb-1 block text-sm font-medium text-theme-text dark:text-theme-text"
						>
							Email Address
						</label>
						<input
							type="email"
							id="email"
							name="email"
							value={data.user?.email || ''}
							required
							class="w-full rounded-md border border-theme-border bg-theme-surface px-3 py-2 text-theme-text placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
						/>
					</div>

					<div>
						<label
							for="bio"
							class="mb-1 block text-sm font-medium text-theme-text dark:text-theme-text"
						>
							Bio
						</label>
						<textarea
							id="bio"
							name="bio"
							rows="3"
							value={data.user?.bio || ''}
							placeholder="Tell visitors about yourself..."
							class="w-full rounded-md border border-theme-border bg-theme-surface px-3 py-2 text-theme-text placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
						></textarea>
					</div>

					<div>
						<label
							for="location"
							class="mb-1 block text-sm font-medium text-theme-text dark:text-theme-text"
						>
							Location
						</label>
						<input
							type="text"
							id="location"
							name="location"
							value={data.user?.location || ''}
							placeholder="San Francisco, CA"
							class="w-full rounded-md border border-theme-border bg-theme-surface px-3 py-2 text-theme-text placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
						/>
					</div>

					<!-- Profile Appearance -->
					<div class="border-t border-theme-border pt-4">
						<h3 class="mb-3 text-sm font-medium text-theme-text dark:text-theme-text">
							Profile Appearance
						</h3>

						<div class="mb-4">
							<label for="profileBackground" class="mb-2 block text-xs text-theme-text-muted">
								Profile Background
							</label>
							<div class="flex items-center gap-3">
								<input
									type="color"
									id="profileBackground"
									name="profileBackground"
									value={data.user?.profileBackground || '#f9fafb'}
									class="h-10 w-20 cursor-pointer rounded border border-theme-border"
								/>
								<select
									name="profileBackgroundPreset"
									onchange={(e) => {
										const input = document.getElementById('profileBackground') as HTMLInputElement;
										if (input && e.currentTarget.value) {
											input.value = e.currentTarget.value;
										}
									}}
									class="rounded-md border border-theme-border bg-theme-surface px-3 py-2 text-theme-text"
								>
									<option value="">Custom Color</option>
									<option value="#f9fafb">Light Gray (Default)</option>
									<option value="#dbeafe">Light Blue</option>
									<option value="#dcfce7">Light Green</option>
									<option value="#fef3c7">Light Yellow</option>
									<option value="#fce7f3">Light Pink</option>
									<option value="#e9d5ff">Light Purple</option>
									<option value="#1f2937">Dark Gray</option>
									<option value="#0f172a">Dark Blue</option>
									<option value="#000000">Black</option>
								</select>
								<span class="text-sm text-theme-text-muted">
									Choose a color for your profile page background
								</span>
							</div>
						</div>

						<!-- Card Appearance Customization -->
						<div class="mb-6 border-t border-theme-border pt-4">
							<h4 class="mb-3 text-sm font-medium text-theme-text">Card Appearance</h4>
							<p class="mb-4 text-xs text-theme-text-muted">
								Customize the colors of your cards to match your style
							</p>

							<div class="grid gap-4 sm:grid-cols-2">
								<!-- Card Background Color -->
								<div>
									<label for="cardBackground" class="mb-2 block text-xs text-theme-text-muted">
										Card Background
									</label>
									<div class="flex items-center gap-2">
										<input
											type="color"
											id="cardBackground"
											name="cardBackground"
											value={data.user?.cardCustomization?.cardBackgroundColor || '#ffffff'}
											class="h-8 w-16 cursor-pointer rounded border border-theme-border"
										/>
										<span class="text-xs text-theme-text-muted">Background color</span>
									</div>
								</div>

								<!-- Card Border Color -->
								<div>
									<label for="cardBorder" class="mb-2 block text-xs text-theme-text-muted">
										Card Border
									</label>
									<div class="flex items-center gap-2">
										<input
											type="color"
											id="cardBorder"
											name="cardBorder"
											value={data.user?.cardCustomization?.cardBorderColor || '#e2e8f0'}
											class="h-8 w-16 cursor-pointer rounded border border-theme-border"
										/>
										<span class="text-xs text-theme-text-muted">Border color</span>
									</div>
								</div>

								<!-- Card Link Color -->
								<div>
									<label for="cardLinks" class="mb-2 block text-xs text-theme-text-muted">
										Card Links/Buttons
									</label>
									<div class="flex items-center gap-2">
										<input
											type="color"
											id="cardLinks"
											name="cardLinks"
											value={data.user?.cardCustomization?.cardLinkColor || '#0ea5e9'}
											class="h-8 w-16 cursor-pointer rounded border border-theme-border"
										/>
										<span class="text-xs text-theme-text-muted">Link & button color</span>
									</div>
								</div>

								<!-- Card Text Color -->
								<div>
									<label for="cardText" class="mb-2 block text-xs text-theme-text-muted">
										Card Text
									</label>
									<div class="flex items-center gap-2">
										<input
											type="color"
											id="cardText"
											name="cardText"
											value={data.user?.cardCustomization?.cardTextColor || '#0f172a'}
											class="h-8 w-16 cursor-pointer rounded border border-theme-border"
										/>
										<span class="text-xs text-theme-text-muted">Text color</span>
									</div>
								</div>
							</div>

							<!-- Card Color Presets -->
							<div class="mt-4">
								<label class="mb-2 block text-xs text-theme-text-muted"> Quick Presets </label>
								<div class="flex flex-wrap gap-2">
									<button
										type="button"
										onclick={() => setCardColors('#ffffff', '#e2e8f0', '#0ea5e9', '#0f172a')}
										class="rounded-md border border-theme-border bg-theme-surface px-3 py-1 text-xs text-theme-text hover:bg-theme-surface-hover"
									>
										Default
									</button>
									<button
										type="button"
										onclick={() => setCardColors('#f8fafc', '#cbd5e1', '#3b82f6', '#1e293b')}
										class="rounded-md border border-theme-border bg-theme-surface px-3 py-1 text-xs text-theme-text hover:bg-theme-surface-hover"
									>
										Cool Blue
									</button>
									<button
										type="button"
										onclick={() => setCardColors('#f0fdf4', '#bbf7d0', '#22c55e', '#166534')}
										class="rounded-md border border-theme-border bg-theme-surface px-3 py-1 text-xs text-theme-text hover:bg-theme-surface-hover"
									>
										Fresh Green
									</button>
									<button
										type="button"
										onclick={() => setCardColors('#1f2937', '#374151', '#60a5fa', '#f3f4f6')}
										class="rounded-md border border-theme-border bg-theme-surface px-3 py-1 text-xs text-theme-text hover:bg-theme-surface-hover"
									>
										Dark Mode
									</button>
								</div>
							</div>
						</div>
					</div>

					<!-- Social Links Section -->
					<div class="border-t border-theme-border pt-4">
						<h3 class="mb-3 text-sm font-medium text-theme-text dark:text-theme-text">
							Social Links
						</h3>

						<div class="space-y-3">
							<div>
								<label for="website" class="mb-1 block text-xs text-theme-text-muted">
									Website
								</label>
								<input
									type="url"
									id="website"
									name="website"
									value={data.user?.website || ''}
									placeholder="https://example.com"
									class="w-full rounded-md border border-theme-border bg-theme-surface px-3 py-2 text-theme-text placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
								/>
							</div>

							<div>
								<label for="github" class="mb-1 block text-xs text-theme-text-muted">
									GitHub Username
								</label>
								<input
									type="text"
									id="github"
									name="github"
									value={data.user?.github || ''}
									placeholder="username"
									class="w-full rounded-md border border-theme-border bg-theme-surface px-3 py-2 text-theme-text placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
								/>
							</div>

							<div>
								<label for="twitter" class="mb-1 block text-xs text-theme-text-muted">
									Twitter/X Username
								</label>
								<input
									type="text"
									id="twitter"
									name="twitter"
									value={data.user?.twitter || ''}
									placeholder="username"
									class="w-full rounded-md border border-theme-border bg-theme-surface px-3 py-2 text-theme-text placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
								/>
							</div>

							<div>
								<label for="linkedin" class="mb-1 block text-xs text-theme-text-muted">
									LinkedIn Username
								</label>
								<input
									type="text"
									id="linkedin"
									name="linkedin"
									value={data.user?.linkedin || ''}
									placeholder="username"
									class="w-full rounded-md border border-theme-border bg-theme-surface px-3 py-2 text-theme-text placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
								/>
							</div>

							<div>
								<label for="instagram" class="mb-1 block text-xs text-theme-text-muted">
									Instagram Username
								</label>
								<input
									type="text"
									id="instagram"
									name="instagram"
									value={data.user?.instagram || ''}
									placeholder="username"
									class="w-full rounded-md border border-theme-border bg-theme-surface px-3 py-2 text-theme-text placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
								/>
							</div>
						</div>
					</div>

					<button
						type="submit"
						disabled={isSubmitting}
						class="rounded-lg bg-theme-primary px-6 py-2 font-medium text-white transition-colors hover:bg-theme-primary disabled:cursor-not-allowed disabled:opacity-50 dark:bg-theme-primary dark:hover:bg-theme-primary"
					>
						{isSubmitting ? 'Saving...' : 'Save Changes'}
					</button>
				</div>
			</form>

			{#if form?.success}
				<div
					class="mt-4 rounded-lg bg-green-50 p-3 text-green-700 dark:bg-green-900/20 dark:text-green-400"
				>
					{form.message}
				</div>
			{/if}
			{#if form?.error}
				<div
					class="mt-4 rounded-lg bg-red-50 p-3 text-red-700 dark:bg-red-900/20 dark:text-red-400"
				>
					{form.error}
				</div>
			{/if}
		</div>

		<!-- Password Section -->
		<div class="rounded-xl bg-white p-6 shadow-xl dark:bg-theme-surface">
			<h2 class="mb-6 text-xl font-semibold text-theme-text dark:text-white">Change Password</h2>

			<form
				method="POST"
				action="?/updatePassword"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ result, update }) => {
						if (result.type === 'success') {
							toastMessages.passwordChanged();
						} else if (result.type === 'failure' && result.data?.error) {
							notify.error(m.error_password_change(), result.data.error);
						}
						await update();
						isSubmitting = false;
					};
				}}
			>
				<div class="space-y-4">
					<div>
						<label
							for="currentPassword"
							class="mb-1 block text-sm font-medium text-theme-text dark:text-theme-text"
						>
							Current Password
						</label>
						<input
							type="password"
							id="currentPassword"
							name="currentPassword"
							required
							class="w-full rounded-md border border-theme-border bg-theme-surface px-3 py-2 text-theme-text placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
						/>
					</div>

					<div>
						<label
							for="newPassword"
							class="mb-1 block text-sm font-medium text-theme-text dark:text-theme-text"
						>
							New Password
						</label>
						<input
							type="password"
							id="newPassword"
							name="newPassword"
							minlength="8"
							required
							class="w-full rounded-md border border-theme-border bg-theme-surface px-3 py-2 text-theme-text placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
						/>
					</div>

					<div>
						<label
							for="confirmPassword"
							class="mb-1 block text-sm font-medium text-theme-text dark:text-theme-text"
						>
							Confirm New Password
						</label>
						<input
							type="password"
							id="confirmPassword"
							name="confirmPassword"
							minlength="8"
							required
							class="w-full rounded-md border border-theme-border bg-theme-surface px-3 py-2 text-theme-text placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
						/>
					</div>

					<button
						type="submit"
						disabled={isSubmitting}
						class="rounded-lg bg-theme-primary px-6 py-2 font-medium text-white transition-colors hover:bg-theme-primary disabled:cursor-not-allowed disabled:opacity-50 dark:bg-theme-primary dark:hover:bg-theme-primary"
					>
						{isSubmitting ? 'Updating...' : 'Update Password'}
					</button>
				</div>
			</form>

			{#if form?.passwordSuccess}
				<div
					class="mt-4 rounded-lg bg-green-50 p-3 text-green-700 dark:bg-green-900/20 dark:text-green-400"
				>
					{form.passwordMessage}
				</div>
			{/if}
			{#if form?.passwordError}
				<div
					class="mt-4 rounded-lg bg-red-50 p-3 text-red-700 dark:bg-red-900/20 dark:text-red-400"
				>
					{form.passwordError}
				</div>
			{/if}
		</div>

		<!-- Workspaces Section -->
		<div class="rounded-xl bg-white p-6 shadow-xl dark:bg-theme-surface">
			<div class="flex items-center justify-between">
				<div>
					<h2 class="text-xl font-semibold text-theme-text dark:text-white">Workspaces</h2>
					<p class="mt-1 text-sm text-theme-text-muted">
						Manage your workspaces and team collaboration
					</p>
				</div>
				<a
					href="/settings/workspaces"
					class="rounded-lg bg-theme-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-theme-primary-hover"
				>
					Manage Workspaces
				</a>
			</div>

			<div class="mt-4 rounded-lg bg-theme-surface p-4">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-theme-text-muted">Current Plan</p>
						<p class="font-medium capitalize text-theme-text">
							{data.user?.subscription_status || 'free'}
						</p>
					</div>
					<div class="text-right">
						<p class="text-sm text-theme-text-muted">Team Members</p>
						<p class="font-medium text-theme-text">
							{#if data.user?.subscription_status === 'free'}
								0 / 1
							{:else if data.user?.subscription_status === 'pro'}
								0 / 3
							{:else if data.user?.subscription_status === 'team'}
								0 / 10
							{:else if data.user?.subscription_status === 'team_plus'}
								0 / ∞
							{:else}
								0 / 1
							{/if}
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Preferences Section -->
		<div class="rounded-xl bg-white p-6 shadow-xl dark:bg-theme-surface">
			<h2 class="mb-6 text-xl font-semibold text-theme-text dark:text-white">Preferences</h2>

			<form
				method="POST"
				action="?/updatePreferences"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						await update();
						isSubmitting = false;
					};
				}}
			>
				<div class="space-y-6">
					<div>
						<h3 class="mb-3 text-sm font-medium text-theme-text dark:text-theme-text">
							Notifications
						</h3>
						<label class="flex cursor-pointer items-center space-x-3">
							<input
								type="checkbox"
								name="emailNotifications"
								checked={data.user?.emailNotifications}
								class="h-4 w-4 rounded border-theme-border text-theme-primary focus:ring-theme-accent"
							/>
							<span class="text-sm text-theme-text dark:text-theme-text">
								Email me when my links reach click milestones
							</span>
						</label>
					</div>

					<div>
						<h3 class="mb-3 text-sm font-medium text-theme-text dark:text-theme-text">Privacy</h3>
						<label class="flex cursor-pointer items-center space-x-3">
							<input
								type="checkbox"
								name="publicProfile"
								checked={data.user?.publicProfile !== false}
								class="h-4 w-4 rounded border-theme-border text-theme-primary focus:ring-theme-accent"
							/>
							<span class="text-sm text-theme-text dark:text-theme-text">
								Make my profile public at /p/{data.user?.username || 'username'}
							</span>
						</label>
						<label class="mt-3 flex cursor-pointer items-center space-x-3">
							<input
								type="checkbox"
								name="showClickStats"
								checked={data.user?.showClickStats !== false}
								class="h-4 w-4 rounded border-theme-border text-theme-primary focus:ring-theme-accent"
							/>
							<span class="text-sm text-theme-text dark:text-theme-text">
								Show click statistics on public profile
							</span>
						</label>
					</div>

					<div>
						<h3 class="mb-3 text-sm font-medium text-theme-text dark:text-theme-text">
							Default Settings
						</h3>
						<label
							for="defaultExpiry"
							class="mb-1 block text-sm text-theme-text dark:text-theme-text"
						>
							Default link expiry (days)
						</label>
						<input
							type="number"
							id="defaultExpiry"
							name="defaultExpiry"
							min="1"
							max="365"
							value={data.user?.defaultExpiry || ''}
							placeholder="Never"
							class="w-full max-w-xs rounded-md border border-theme-border bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-theme-border dark:bg-theme-surface dark:text-white"
						/>
					</div>

					<button
						type="submit"
						disabled={isSubmitting}
						class="rounded-lg bg-theme-primary px-6 py-2 font-medium text-white transition-colors hover:bg-theme-primary disabled:cursor-not-allowed disabled:opacity-50 dark:bg-theme-primary dark:hover:bg-theme-primary"
					>
						{isSubmitting ? 'Saving...' : 'Save Preferences'}
					</button>
				</div>
			</form>

			{#if form?.preferencesSuccess}
				<div
					class="mt-4 rounded-lg bg-green-50 p-3 text-green-700 dark:bg-green-900/20 dark:text-green-400"
				>
					{form.preferencesMessage}
				</div>
			{/if}
			{#if form?.preferencesError}
				<div
					class="mt-4 rounded-lg bg-red-50 p-3 text-red-700 dark:bg-red-900/20 dark:text-red-400"
				>
					{form.preferencesError}
				</div>
			{/if}
		</div>

		<!-- Danger Zone Section -->
		<div class="rounded-xl bg-white p-6 shadow-xl dark:bg-theme-surface">
			<h2 class="mb-6 text-xl font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>

			<div
				class="rounded-lg border-2 border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20"
			>
				<h3 class="mb-2 text-lg font-semibold text-red-700 dark:text-red-400">Delete Account</h3>
				<p class="mb-4 text-sm text-red-600 dark:text-red-300">
					Once you delete your account, there is no going back. All your links and data will be
					permanently removed.
				</p>

				{#if !showDeleteConfirm}
					<button
						onclick={() => (showDeleteConfirm = true)}
						class="rounded-lg bg-red-600 px-6 py-2 font-medium text-white transition-colors hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
					>
						Delete My Account
					</button>
				{:else}
					<div class="space-y-4">
						<p class="text-sm text-red-700 dark:text-red-300">
							Please type <strong>DELETE</strong> to confirm:
						</p>
						<input
							type="text"
							bind:value={deleteConfirmText}
							placeholder="Type DELETE"
							class="w-full max-w-xs rounded-md border border-red-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-red-600 dark:bg-theme-surface dark:text-white"
						/>
						<div class="flex gap-3">
							<form
								method="POST"
								action="?/deleteAccount"
								use:enhance={() => {
									if (deleteConfirmText !== 'DELETE') {
										alert('Please type DELETE to confirm');
										return () => {};
									}
									return async ({ update }) => {
										await update();
									};
								}}
							>
								<button
									type="submit"
									disabled={deleteConfirmText !== 'DELETE'}
									class="rounded-lg bg-red-600 px-6 py-2 font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-600"
								>
									Permanently Delete Account
								</button>
							</form>
							<button
								onclick={() => {
									showDeleteConfirm = false;
									deleteConfirmText = '';
								}}
								class="rounded-lg border border-theme-border bg-white px-6 py-2 font-medium text-theme-text transition-colors hover:bg-theme-surface dark:border-theme-border dark:bg-theme-surface dark:text-theme-text dark:hover:bg-theme-surface"
							>
								Cancel
							</button>
						</div>
					</div>
				{/if}

				{#if form?.deleteError}
					<div
						class="mt-4 rounded-lg bg-red-100 p-3 text-red-700 dark:bg-red-900/30 dark:text-red-400"
					>
						{form.deleteError}
					</div>
				{/if}
			</div>
		</div>
	</div>
</SettingsPage>
