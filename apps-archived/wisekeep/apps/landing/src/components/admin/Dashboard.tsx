import { createSignal, createEffect, onMount, For } from 'solid-js';

interface Job {
	id: string;
	url: string;
	status: string;
	progress: number;
	created_at: string;
	video_info: any;
}

interface Stats {
	total_transcripts: number;
	total_size_mb: number;
	active_jobs: number;
	completed_jobs: number;
	failed_jobs: number;
}

const API_URL = 'http://localhost:8000';

export default function Dashboard() {
	const [jobs, setJobs] = createSignal<Job[]>([]);
	const [stats, setStats] = createSignal<Stats | null>(null);
	const [newUrl, setNewUrl] = createSignal('');
	const [selectedModel, setSelectedModel] = createSignal('base');
	const [isLoading, setIsLoading] = createSignal(false);
	const [ws, setWs] = createSignal<WebSocket | null>(null);

	onMount(() => {
		fetchJobs();
		fetchStats();
		connectWebSocket();
	});

	const connectWebSocket = () => {
		const websocket = new WebSocket(`ws://localhost:8000/ws/progress`);

		websocket.onopen = () => {
			console.log('WebSocket connected');
		};

		websocket.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (data.type === 'job_update' || data.type === 'job_complete') {
				fetchJobs();
				fetchStats();
			}
		};

		websocket.onerror = (error) => {
			console.error('WebSocket error:', error);
		};

		setWs(websocket);
	};

	const fetchJobs = async () => {
		try {
			const response = await fetch(`${API_URL}/api/jobs`);
			const data = await response.json();
			setJobs(data);
		} catch (error) {
			console.error('Error fetching jobs:', error);
		}
	};

	const fetchStats = async () => {
		try {
			const response = await fetch(`${API_URL}/api/stats`);
			const data = await response.json();
			setStats(data);
		} catch (error) {
			console.error('Error fetching stats:', error);
		}
	};

	const startTranscription = async () => {
		if (!newUrl()) return;

		setIsLoading(true);
		try {
			const response = await fetch(`${API_URL}/api/transcribe`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					url: newUrl(),
					model: selectedModel(),
					language: 'de',
				}),
			});

			if (response.ok) {
				setNewUrl('');
				fetchJobs();
				fetchStats();
			}
		} catch (error) {
			console.error('Error starting transcription:', error);
		}
		setIsLoading(false);
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'pending':
				return 'text-yellow-400';
			case 'downloading':
				return 'text-blue-400';
			case 'transcribing':
				return 'text-purple-400';
			case 'completed':
				return 'text-green-400';
			case 'failed':
				return 'text-red-400';
			default:
				return 'text-gray-400';
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'pending':
				return '⏳';
			case 'downloading':
				return '⬇️';
			case 'transcribing':
				return '🎙️';
			case 'completed':
				return '✅';
			case 'failed':
				return '❌';
			default:
				return '❓';
		}
	};

	return (
		<div class="space-y-6">
			{/* Stats Cards */}
			<div class="grid grid-cols-1 md:grid-cols-5 gap-4">
				<div class="bg-gray-800 p-4 rounded-lg">
					<div class="text-2xl font-bold text-white">{stats()?.total_transcripts || 0}</div>
					<div class="text-sm text-gray-400">Transkripte</div>
				</div>
				<div class="bg-gray-800 p-4 rounded-lg">
					<div class="text-2xl font-bold text-white">{stats()?.total_size_mb || 0} MB</div>
					<div class="text-sm text-gray-400">Speicher</div>
				</div>
				<div class="bg-gray-800 p-4 rounded-lg">
					<div class="text-2xl font-bold text-yellow-400">{stats()?.active_jobs || 0}</div>
					<div class="text-sm text-gray-400">Aktiv</div>
				</div>
				<div class="bg-gray-800 p-4 rounded-lg">
					<div class="text-2xl font-bold text-green-400">{stats()?.completed_jobs || 0}</div>
					<div class="text-sm text-gray-400">Fertig</div>
				</div>
				<div class="bg-gray-800 p-4 rounded-lg">
					<div class="text-2xl font-bold text-red-400">{stats()?.failed_jobs || 0}</div>
					<div class="text-sm text-gray-400">Fehler</div>
				</div>
			</div>

			{/* New Transcription Form */}
			<div class="bg-gray-800 p-6 rounded-lg">
				<h2 class="text-xl font-bold mb-4">Neue Transkription</h2>
				<div class="flex gap-4">
					<input
						type="text"
						value={newUrl()}
						onInput={(e) => setNewUrl(e.currentTarget.value)}
						placeholder="YouTube URL eingeben..."
						class="flex-1 px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<select
						value={selectedModel()}
						onChange={(e) => setSelectedModel(e.currentTarget.value)}
						class="px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="tiny">Tiny (Schnell)</option>
						<option value="base">Base</option>
						<option value="small">Small</option>
						<option value="medium">Medium</option>
						<option value="large">Large (Beste Qualität)</option>
					</select>
					<button
						onClick={startTranscription}
						disabled={isLoading() || !newUrl()}
						class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isLoading() ? 'Lädt...' : 'Starten'}
					</button>
				</div>
			</div>

			{/* Active Jobs */}
			<div class="bg-gray-800 p-6 rounded-lg">
				<h2 class="text-xl font-bold mb-4">Aktive Jobs</h2>
				<div class="space-y-4">
					<For each={jobs()}>
						{(job) => (
							<div class="bg-gray-700 p-4 rounded-lg">
								<div class="flex items-center justify-between mb-2">
									<div class="flex items-center space-x-2">
										<span class="text-xl">{getStatusIcon(job.status)}</span>
										<span class={`font-semibold ${getStatusColor(job.status)}`}>
											{job.status.toUpperCase()}
										</span>
									</div>
									<div class="text-sm text-gray-400">
										{new Date(job.created_at).toLocaleString('de-DE')}
									</div>
								</div>
								<div class="text-sm text-gray-300 mb-2 truncate">{job.url}</div>
								{job.status !== 'completed' && job.status !== 'failed' && (
									<div class="w-full bg-gray-600 rounded-full h-2">
										<div
											class="bg-blue-500 h-2 rounded-full transition-all duration-300"
											style={`width: ${job.progress}%`}
										/>
									</div>
								)}
							</div>
						)}
					</For>
					{jobs().length === 0 && (
						<div class="text-center text-gray-400 py-8">Keine aktiven Jobs</div>
					)}
				</div>
			</div>
		</div>
	);
}
