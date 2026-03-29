import { createSignal, createEffect, onMount, For, Show } from 'solid-js';

interface Playlist {
	category: string;
	name: string;
	path: string;
	url_count: number;
	urls: string[];
}

const API_URL = 'http://localhost:8000';

export default function PlaylistManager() {
	const [playlists, setPlaylists] = createSignal<Playlist[]>([]);
	const [selectedPlaylist, setSelectedPlaylist] = createSignal<Playlist | null>(null);
	const [newPlaylistName, setNewPlaylistName] = createSignal('');
	const [newPlaylistCategory, setNewPlaylistCategory] = createSignal('general');
	const [newUrls, setNewUrls] = createSignal('');
	const [isCreating, setIsCreating] = createSignal(false);
	const [isProcessing, setIsProcessing] = createSignal(false);

	onMount(() => {
		fetchPlaylists();
	});

	const fetchPlaylists = async () => {
		try {
			const response = await fetch(`${API_URL}/api/playlists`);
			const data = await response.json();
			setPlaylists(data);
		} catch (error) {
			console.error('Error fetching playlists:', error);
		}
	};

	const createPlaylist = async () => {
		if (!newPlaylistName() || !newUrls()) return;

		try {
			const urls = newUrls()
				.split('\n')
				.filter((url) => url.trim());
			const name =
				newPlaylistCategory() === 'general'
					? newPlaylistName()
					: `${newPlaylistCategory()}/${newPlaylistName()}`;

			const response = await fetch(`${API_URL}/api/playlists`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: name,
					urls: urls,
				}),
			});

			if (response.ok) {
				setNewPlaylistName('');
				setNewUrls('');
				setIsCreating(false);
				fetchPlaylists();
			}
		} catch (error) {
			console.error('Error creating playlist:', error);
		}
	};

	const processPlaylist = async (playlist: Playlist) => {
		setIsProcessing(true);
		try {
			// Process each URL in the playlist
			for (const url of playlist.urls) {
				await fetch(`${API_URL}/api/transcribe`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						url: url,
						model: 'large',
						language: 'de',
					}),
				});
			}
			alert(`Started processing ${playlist.url_count} videos from ${playlist.name}`);
		} catch (error) {
			console.error('Error processing playlist:', error);
		}
		setIsProcessing(false);
	};

	const getCategoryColor = (category: string) => {
		const colors: { [key: string]: string } = {
			tech: 'bg-blue-900',
			people: 'bg-purple-900',
			musik: 'bg-pink-900',
			gaming: 'bg-green-900',
			general: 'bg-gray-800',
		};
		return colors[category] || 'bg-gray-800';
	};

	const getCategoryIcon = (category: string) => {
		const icons: { [key: string]: string } = {
			tech: '💻',
			people: '👥',
			musik: '🎵',
			gaming: '🎮',
			general: '📁',
		};
		return icons[category] || '📁';
	};

	return (
		<div class="space-y-6">
			{/* Header with Create Button */}
			<div class="flex justify-between items-center">
				<h1 class="text-2xl font-bold">Playlists</h1>
				<button
					onClick={() => setIsCreating(true)}
					class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
				>
					+ Neue Playlist
				</button>
			</div>

			{/* Create New Playlist Form */}
			<Show when={isCreating()}>
				<div class="bg-gray-800 p-6 rounded-lg">
					<h2 class="text-xl font-bold mb-4">Neue Playlist erstellen</h2>
					<div class="space-y-4">
						<div class="flex gap-4">
							<select
								value={newPlaylistCategory()}
								onChange={(e) => setNewPlaylistCategory(e.currentTarget.value)}
								class="px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="general">General</option>
								<option value="tech">Tech</option>
								<option value="people">People</option>
								<option value="musik">Musik</option>
								<option value="gaming">Gaming</option>
							</select>
							<input
								type="text"
								value={newPlaylistName()}
								onInput={(e) => setNewPlaylistName(e.currentTarget.value)}
								placeholder="Playlist Name..."
								class="flex-1 px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
						<textarea
							value={newUrls()}
							onInput={(e) => setNewUrls(e.currentTarget.value)}
							placeholder="YouTube URLs (eine pro Zeile)..."
							rows={6}
							class="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						<div class="flex gap-4">
							<button
								onClick={createPlaylist}
								disabled={!newPlaylistName() || !newUrls()}
								class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
							>
								Erstellen
							</button>
							<button
								onClick={() => {
									setIsCreating(false);
									setNewPlaylistName('');
									setNewUrls('');
								}}
								class="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
							>
								Abbrechen
							</button>
						</div>
					</div>
				</div>
			</Show>

			{/* Playlists Grid */}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				<For each={playlists()}>
					{(playlist) => (
						<div
							class={`${getCategoryColor(playlist.category)} p-6 rounded-lg cursor-pointer hover:opacity-90 transition-opacity`}
							onClick={() => setSelectedPlaylist(playlist)}
						>
							<div class="flex items-start justify-between mb-2">
								<div class="flex items-center space-x-2">
									<span class="text-2xl">{getCategoryIcon(playlist.category)}</span>
									<div>
										<h3 class="font-bold text-lg">{playlist.name}</h3>
										<p class="text-sm text-gray-400">{playlist.category}</p>
									</div>
								</div>
								<span class="bg-gray-700 px-2 py-1 rounded text-sm">
									{playlist.url_count} Videos
								</span>
							</div>
							<button
								onClick={(e) => {
									e.stopPropagation();
									processPlaylist(playlist);
								}}
								disabled={isProcessing()}
								class="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
							>
								{isProcessing() ? 'Verarbeite...' : 'Alle transkribieren'}
							</button>
						</div>
					)}
				</For>
			</div>

			{/* Selected Playlist Details */}
			<Show when={selectedPlaylist()}>
				<div class="bg-gray-800 p-6 rounded-lg">
					<div class="flex justify-between items-center mb-4">
						<h2 class="text-xl font-bold">{selectedPlaylist()!.name} - URLs</h2>
						<button
							onClick={() => setSelectedPlaylist(null)}
							class="text-gray-400 hover:text-white"
						>
							✕
						</button>
					</div>
					<div class="space-y-2 max-h-96 overflow-y-auto">
						<For each={selectedPlaylist()!.urls}>
							{(url, index) => (
								<div class="flex items-center space-x-2 p-2 bg-gray-700 rounded">
									<span class="text-gray-400 text-sm">{index() + 1}.</span>
									<a
										href={url}
										target="_blank"
										class="text-blue-400 hover:underline text-sm truncate flex-1"
									>
										{url}
									</a>
								</div>
							)}
						</For>
					</div>
				</div>
			</Show>

			{playlists().length === 0 && !isCreating() && (
				<div class="text-center text-gray-400 py-12">
					<p class="text-xl mb-4">Keine Playlists vorhanden</p>
					<button
						onClick={() => setIsCreating(true)}
						class="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
					>
						Erste Playlist erstellen
					</button>
				</div>
			)}
		</div>
	);
}
