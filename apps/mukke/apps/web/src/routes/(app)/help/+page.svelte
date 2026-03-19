<script lang="ts">
	import { goto } from '$app/navigation';
	import { SettingsPage, SettingsSection, SettingsCard, SettingsRow } from '@manacore/shared-ui';
	import { Question, Keyboard, EnvelopeSimple } from '@manacore/shared-icons';
</script>

<svelte:head>
	<title>Help - Mukke</title>
</svelte:head>

<SettingsPage title="Help & Support" subtitle="Learn how to use Mukke">
	<SettingsSection title="Getting Started">
		{#snippet icon()}<Question size={20} />{/snippet}
		<SettingsCard>
			<SettingsRow
				label="Upload Music"
				description="Drag and drop audio files or click Browse to upload MP3, WAV, FLAC, and more."
			/>
			<SettingsRow
				label="Auto Tag Extraction"
				description="ID3 tags (title, artist, album, cover art) are automatically extracted from uploaded files."
			/>
			<SettingsRow
				label="Edit Metadata"
				description="Click the pencil icon on any song in your library to edit metadata. Use 'Write to File' to save tags back to MP3 files."
			/>
			<SettingsRow
				label="Playlists"
				description="Create playlists to organize your music. Add songs from the library or search."
			/>
			<SettingsRow
				label="Editor Projects"
				description="Open songs in the editor for waveform visualization, BPM detection, and synced lyrics creation."
			/>
		</SettingsCard>
	</SettingsSection>

	<SettingsSection title="Keyboard Shortcuts">
		{#snippet icon()}<Keyboard size={20} />{/snippet}
		<SettingsCard>
			<SettingsRow
				label="Ctrl + 1-5"
				description="Navigate to Library, Playlists, Editor, Upload, Settings"
			/>
			<SettingsRow label="Space" description="Play / Pause (in editor)" />
		</SettingsCard>
	</SettingsSection>

	<SettingsSection title="Contact">
		{#snippet icon()}<EnvelopeSimple size={20} />{/snippet}
		<SettingsCard>
			<SettingsRow
				label="Feedback"
				description="Send us your suggestions and bug reports"
				href="/feedback"
			/>
		</SettingsCard>
	</SettingsSection>
</SettingsPage>
