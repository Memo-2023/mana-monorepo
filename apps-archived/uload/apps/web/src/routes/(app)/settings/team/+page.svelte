<script lang="ts">
	import { enhance } from '$app/forms';
	import { Users, Mail, UserPlus, Trash2, Shield, AlertCircle, Check, X } from 'lucide-svelte';
	import type { PageData, ActionData } from './$types';
	import { canAddTeamMembers, getTeamMemberLimit } from '$lib/types/accounts';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let inviteEmail = $state('');
	let isInviting = $state(false);

	// Everyone can invite, but with different limits
	const teamLimit = $derived(getTeamMemberLimit(data.user?.subscription_status));
	const remainingSlots = $derived(
		teamLimit === 0 ? Infinity : teamLimit - (data.teamMembers?.length || 0)
	);
</script>

<div class="mx-auto max-w-4xl">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-theme-text">Team Management</h1>
		<p class="mt-2 text-theme-text-muted">Invite team members to collaborate on your account</p>
	</div>

	<!-- Current Plan Info -->
	<div class="mb-6 rounded-lg bg-theme-surface p-6">
		<div class="flex items-center justify-between">
			<div>
				<p class="text-sm text-theme-text-muted">Current Plan</p>
				<p class="text-xl font-semibold capitalize text-theme-text">
					{data.user?.subscription_status || 'free'}
				</p>
			</div>
			<div class="text-right">
				<p class="text-sm text-theme-text-muted">Team Members</p>
				<p class="text-xl font-semibold text-theme-text">
					{data.teamMembers?.length || 0}{teamLimit > 0 ? ` / ${teamLimit}` : ''}
				</p>
			</div>
		</div>

		{#if teamLimit > 0 && (data.teamMembers?.length || 0) >= teamLimit}
			<div class="bg-theme-warning/10 mt-4 rounded-lg p-4">
				<div class="flex items-start gap-3">
					<AlertCircle class="text-theme-warning h-5 w-5" />
					<div>
						<p class="font-medium text-theme-text">Team member limit reached</p>
						<p class="mt-1 text-sm text-theme-text-muted">
							Upgrade to a higher plan for more team members.
						</p>
						<a
							href="/pricing"
							class="mt-2 inline-block text-sm font-medium text-theme-primary hover:underline"
						>
							View Plans →
						</a>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Invite Form - Available for all users -->
	<div class="mb-8 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
		<h2 class="mb-4 flex items-center gap-2 text-lg font-semibold text-theme-text">
			<UserPlus class="h-5 w-5" />
			Invite Team Member
		</h2>

		{#if teamLimit === 0 || remainingSlots > 0}
			<form
				method="POST"
				action="?/invite"
				use:enhance={() => {
					isInviting = true;
					return async ({ update }) => {
						await update();
						isInviting = false;
						if (form?.success) {
							inviteEmail = '';
						}
					};
				}}
			>
				<div class="flex gap-3">
					<input
						type="email"
						name="email"
						bind:value={inviteEmail}
						placeholder="colleague@example.com"
						required
						class="focus:ring-theme-primary/20 flex-1 rounded-lg border border-theme-border bg-theme-background px-4 py-2 text-theme-text placeholder-theme-text-muted focus:border-theme-primary focus:outline-none focus:ring-2"
					/>
					<button
						type="submit"
						disabled={isInviting || !inviteEmail}
						class="flex items-center gap-2 rounded-lg bg-theme-primary px-4 py-2 font-medium text-white hover:bg-theme-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
					>
						<Mail class="h-4 w-4" />
						Send Invite
					</button>
				</div>
			</form>

			{#if form?.error}
				<div class="mt-3 text-sm text-red-600 dark:text-red-400">
					{form.error}
				</div>
			{/if}

			{#if form?.success}
				<div class="mt-3">
					<p class="text-sm text-green-600 dark:text-green-400">
						✓ Invitation created successfully!
					</p>
					<p class="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
						⚠️ E-Mail-Versand ist möglicherweise nicht konfiguriert. Du findest den Einladungslink
						unten zum manuellen Teilen.
					</p>
				</div>
			{/if}
		{:else}
			<div class="rounded-lg bg-theme-surface p-4">
				<p class="text-sm text-theme-text-muted">
					You've reached your team member limit. Upgrade to Team Plus for more members.
				</p>
			</div>
		{/if}
	</div>

	<!-- Team Members List -->
	{#if data.teamMembers && data.teamMembers.length > 0}
		<div class="rounded-lg bg-white shadow-sm dark:bg-gray-800">
			<div class="border-b border-theme-border px-6 py-4">
				<h2 class="flex items-center gap-2 text-lg font-semibold text-theme-text">
					<Users class="h-5 w-5" />
					Team Members ({data.teamMembers.length})
				</h2>
			</div>

			<div class="divide-y divide-theme-border">
				{#each data.teamMembers as member}
					<div class="flex items-center justify-between px-6 py-4">
						<div class="flex items-center gap-4">
							<div
								class="bg-theme-primary/10 flex h-10 w-10 items-center justify-center rounded-full text-theme-primary"
							>
								{member.user?.email?.[0]?.toUpperCase() || 'U'}
							</div>
							<div>
								<p class="font-medium text-theme-text">
									{member.user?.name || member.user?.email}
								</p>
								<p class="text-sm text-theme-text-muted">
									{member.user?.email}
								</p>
							</div>
						</div>

						<div class="flex items-center gap-3">
							{#if member.invitation_status === 'pending'}
								<span
									class="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
								>
									Pending
								</span>
							{:else if member.invitation_status === 'accepted'}
								<span
									class="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-400"
								>
									Active
								</span>
							{/if}

							{#if member.permissions?.manage_team}
								<Shield class="h-4 w-4 text-theme-text-muted" title="Team Admin" />
							{/if}

							<form method="POST" action="?/remove" use:enhance>
								<input type="hidden" name="memberId" value={member.id} />
								<button
									type="submit"
									class="rounded p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
									title="Remove team member"
								>
									<Trash2 class="h-4 w-4" />
								</button>
							</form>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<div class="rounded-lg bg-theme-surface p-8 text-center">
			<Users class="mx-auto mb-3 h-12 w-12 text-theme-text-muted" />
			<p class="text-theme-text-muted">No team members yet. Invite someone to get started!</p>
		</div>
	{/if}

	<!-- Pending Invitations -->
	{#if (data.pendingInvites && data.pendingInvites.length > 0) || (data.pendingNewUserInvites && data.pendingNewUserInvites.length > 0)}
		<div class="mt-6 rounded-lg bg-white shadow-sm dark:bg-gray-800">
			<div class="border-b border-theme-border px-6 py-4">
				<h2 class="text-lg font-semibold text-theme-text">Pending Invitations</h2>
			</div>

			<div class="divide-y divide-theme-border">
				{#each data.pendingInvites as invite}
					<div class="flex items-center justify-between px-6 py-4">
						<div>
							<p class="font-medium text-theme-text">
								{invite.expand?.user?.email || 'Unknown'}
							</p>
							<p class="text-sm text-theme-text-muted">
								Invited {new Date(invite.invited_at).toLocaleDateString()} · Existing user
							</p>
						</div>

						<div class="flex gap-2">
							<form method="POST" action="?/resend" use:enhance>
								<input type="hidden" name="inviteId" value={invite.id} />
								<button type="submit" class="text-sm text-theme-primary hover:underline">
									Resend
								</button>
							</form>

							<form method="POST" action="?/cancelInvite" use:enhance>
								<input type="hidden" name="inviteId" value={invite.id} />
								<button
									type="submit"
									class="text-sm text-red-600 hover:underline dark:text-red-400"
								>
									Cancel
								</button>
							</form>
						</div>
					</div>
				{/each}

				{#each data.pendingNewUserInvites || [] as invite}
					<div class="px-6 py-4">
						<div class="mb-2 flex items-center justify-between">
							<div>
								<p class="font-medium text-theme-text">
									{invite.email}
								</p>
								<p class="text-sm text-theme-text-muted">
									Invited {new Date(invite.created).toLocaleDateString()} · New user (needs to sign up)
								</p>
							</div>

							<div class="flex gap-2">
								<button
									type="button"
									onclick={() => {
										const url = `${window.location.origin}/register?invite=${invite.token}`;
										navigator.clipboard.writeText(url);
										// Simple feedback
										event.target.textContent = 'Copied!';
										setTimeout(() => {
											event.target.textContent = 'Copy invite link';
										}, 2000);
									}}
									class="text-sm text-theme-primary hover:underline"
								>
									Copy invite link
								</button>
							</div>
						</div>

						<!-- Show invite URL for manual sharing -->
						<div
							class="mt-2 break-all rounded bg-gray-50 p-2 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
						>
							<span class="font-medium">Invite link:</span>
							{window.location.origin}/register?invite={invite.token}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
