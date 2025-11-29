import { createSignal, createEffect, onMount, For, Show } from 'solid-js';

interface Transcript {
	playlist: string;
	channel: string;
	filename: string;
	path: string;
	size: number;
	modified: string;
}

const API_URL = 'http://localhost:8000';

export default function TranscriptViewer() {
	const [transcripts, setTranscripts] = createSignal<Transcript[]>([]);
	const [selectedTranscript, setSelectedTranscript] = createSignal<Transcript | null>(null);
	const [transcriptContent, setTranscriptContent] = createSignal<string>('');
	const [searchQuery, setSearchQuery] = createSignal('');
	const [filteredTranscripts, setFilteredTranscripts] = createSignal<Transcript[]>([]);
	const [isLoading, setIsLoading] = createSignal(false);

	onMount(() => {
		fetchTranscripts();
	});

	createEffect(() => {
		const query = searchQuery().toLowerCase();
		if (query) {
			setFilteredTranscripts(
				transcripts().filter(
					(t) =>
						t.filename.toLowerCase().includes(query) ||
						t.channel.toLowerCase().includes(query) ||
						t.playlist.toLowerCase().includes(query)
				)
			);
		} else {
			setFilteredTranscripts(transcripts());
		}
	});

	const fetchTranscripts = async () => {
		try {
			const response = await fetch(`${API_URL}/api/transcripts`);
			const data = await response.json();
			setTranscripts(data);
			setFilteredTranscripts(data);
		} catch (error) {
			console.error('Error fetching transcripts:', error);
		}
	};

	const loadTranscript = async (transcript: Transcript) => {
		setIsLoading(true);
		setSelectedTranscript(transcript);
		try {
			const response = await fetch(`${API_URL}/api/transcript/${transcript.path}`);
			const content = await response.text();
			setTranscriptContent(content);
		} catch (error) {
			console.error('Error loading transcript:', error);
			setTranscriptContent('Fehler beim Laden des Transkripts');
		}
		setIsLoading(false);
	};

	const downloadTranscript = (transcript: Transcript) => {
		const link = document.createElement('a');
		link.href = `${API_URL}/api/transcript/${transcript.path}`;
		link.download = transcript.filename;
		link.click();
	};

	const formatFileSize = (bytes: number) => {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const getPlaylistIcon = (playlist: string) => {
		if (playlist.includes('tech')) return '💻';
		if (playlist.includes('people')) return '👥';
		if (playlist.includes('musik')) return '🎵';
		if (playlist.includes('gaming')) return '🎮';
		return '📁';
	};

	return (
		<div class="space-y-6">
			{/* Search Bar */}
			<div class="bg-gray-800 p-4 rounded-lg">
				<input
					type="text"
					value={searchQuery()}
					onInput={(e) => setSearchQuery(e.currentTarget.value)}
					placeholder="Transkripte durchsuchen..."
					class="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Transcript List */}
				<div class="bg-gray-800 p-6 rounded-lg">
					<h2 class="text-xl font-bold mb-4">Transkripte ({filteredTranscripts().length})</h2>
					<div class="space-y-2 max-h-[600px] overflow-y-auto">
						<For each={filteredTranscripts()}>
							{(transcript) => (
								<div
									class={`p-4 rounded-lg cursor-pointer transition-colors ${
										selectedTranscript()?.path === transcript.path
											? 'bg-blue-900'
											: 'bg-gray-700 hover:bg-gray-600'
									}`}
									onClick={() => loadTranscript(transcript)}
								>
									<div class="flex items-start justify-between">
										<div class="flex-1">
											<div class="flex items-center space-x-2 mb-1">
												<span class="text-lg">{getPlaylistIcon(transcript.playlist)}</span>
												<span class="text-sm text-gray-400">{transcript.playlist}</span>
											</div>
											<h3 class="font-semibold text-sm mb-1 line-clamp-2">
												{transcript.filename.replace(/_/g, ' ').replace('.txt', '')}
											</h3>
											<div class="flex items-center space-x-4 text-xs text-gray-400">
												<span>{transcript.channel}</span>
												<span>{formatFileSize(transcript.size)}</span>
											</div>
										</div>
										<button
											onClick={(e) => {
												e.stopPropagation();
												downloadTranscript(transcript);
											}}
											class="ml-2 p-2 text-gray-400 hover:text-white"
											title="Download"
										>
											⬇️
										</button>
									</div>
									<div class="text-xs text-gray-500 mt-2">{formatDate(transcript.modified)}</div>
								</div>
							)}
						</For>
						{filteredTranscripts().length === 0 && (
							<div class="text-center text-gray-400 py-8">
								{searchQuery() ? 'Keine Transkripte gefunden' : 'Noch keine Transkripte vorhanden'}
							</div>
						)}
					</div>
				</div>

				{/* Transcript Content Viewer */}
				<div class="bg-gray-800 p-6 rounded-lg">
					<Show when={selectedTranscript()}>
						<div class="flex justify-between items-center mb-4">
							<h2 class="text-xl font-bold">Transkript-Inhalt</h2>
							<div class="flex space-x-2">
								<button
									onClick={() => {
										navigator.clipboard.writeText(transcriptContent());
										alert('In Zwischenablage kopiert!');
									}}
									class="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
								>
									📋 Kopieren
								</button>
								<button
									onClick={() => downloadTranscript(selectedTranscript()!)}
									class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
								>
									⬇️ Download
								</button>
							</div>
						</div>
					</Show>

					<Show when={isLoading()}>
						<div class="text-center py-12">
							<div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
							<p class="mt-4 text-gray-400">Lade Transkript...</p>
						</div>
					</Show>

					<Show when={!isLoading() && selectedTranscript()}>
						<div class="bg-gray-900 p-4 rounded-lg max-h-[500px] overflow-y-auto">
							<pre class="text-sm text-gray-300 whitespace-pre-wrap font-mono">
								{transcriptContent()}
							</pre>
						</div>
					</Show>

					<Show when={!selectedTranscript() && !isLoading()}>
						<div class="text-center text-gray-400 py-12">
							<p class="text-xl mb-2">Kein Transkript ausgewählt</p>
							<p class="text-sm">Wähle ein Transkript aus der Liste aus</p>
						</div>
					</Show>
				</div>
			</div>

			{/* Statistics */}
			<div class="bg-gray-800 p-4 rounded-lg">
				<div class="grid grid-cols-3 gap-4 text-center">
					<div>
						<div class="text-2xl font-bold text-white">{transcripts().length}</div>
						<div class="text-sm text-gray-400">Gesamt</div>
					</div>
					<div>
						<div class="text-2xl font-bold text-white">
							{formatFileSize(transcripts().reduce((sum, t) => sum + t.size, 0))}
						</div>
						<div class="text-sm text-gray-400">Speicher</div>
					</div>
					<div>
						<div class="text-2xl font-bold text-white">
							{[...new Set(transcripts().map((t) => t.channel))].length}
						</div>
						<div class="text-sm text-gray-400">Kanäle</div>
					</div>
				</div>
			</div>
		</div>
	);
}
