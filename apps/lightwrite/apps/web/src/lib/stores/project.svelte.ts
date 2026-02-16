import type { Project, Beat, Lyrics, LyricLine, Marker } from '@lightwrite/shared';
import { authStore } from './auth.svelte';

interface ProjectState {
	projects: Project[];
	currentProject: Project | null;
	currentBeat: Beat | null;
	currentLyrics: Lyrics | null;
	currentLines: LyricLine[];
	currentMarkers: Marker[];
	isLoading: boolean;
	error: string | null;
}

function getBackendUrl(): string {
	if (typeof window !== 'undefined') {
		return (
			(window as unknown as { __PUBLIC_BACKEND_URL__: string }).__PUBLIC_BACKEND_URL__ ||
			'http://localhost:3010'
		);
	}
	return 'http://localhost:3010';
}

function createProjectStore() {
	let state = $state<ProjectState>({
		projects: [],
		currentProject: null,
		currentBeat: null,
		currentLyrics: null,
		currentLines: [],
		currentMarkers: [],
		isLoading: false,
		error: null,
	});

	async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
		const response = await fetch(`${getBackendUrl()}${path}`, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				...authStore.getAuthHeaders(),
				...options.headers,
			},
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({ message: 'Request failed' }));
			throw new Error(error.message || 'Request failed');
		}

		return response.json();
	}

	return {
		get projects() {
			return state.projects;
		},
		get currentProject() {
			return state.currentProject;
		},
		get currentBeat() {
			return state.currentBeat;
		},
		get currentLyrics() {
			return state.currentLyrics;
		},
		get currentLines() {
			return state.currentLines;
		},
		get currentMarkers() {
			return state.currentMarkers;
		},
		get isLoading() {
			return state.isLoading;
		},
		get error() {
			return state.error;
		},

		async loadProjects() {
			state.isLoading = true;
			state.error = null;
			try {
				const data = await fetchApi<{ projects: Project[] }>('/projects');
				state.projects = data.projects;
			} catch (e) {
				state.error = e instanceof Error ? e.message : 'Failed to load projects';
			}
			state.isLoading = false;
		},

		async loadProject(id: string) {
			state.isLoading = true;
			state.error = null;
			try {
				const data = await fetchApi<{
					project: Project & { beat: Beat | null; lyrics: Lyrics | null };
				}>(`/projects/${id}`);
				state.currentProject = data.project;
				state.currentBeat = data.project.beat;
				state.currentLyrics = data.project.lyrics;

				// Load markers if beat exists
				if (data.project.beat) {
					const markersData = await fetchApi<{ markers: Marker[] }>(
						`/markers/beat/${data.project.beat.id}`
					);
					state.currentMarkers = markersData.markers;
				}

				// Load lyrics lines if lyrics exists
				if (data.project.lyrics) {
					const lyricsData = await fetchApi<{ lyrics: { lines: LyricLine[] } | null }>(
						`/lyrics/project/${id}`
					);
					state.currentLines = lyricsData.lyrics?.lines || [];
				}
			} catch (e) {
				state.error = e instanceof Error ? e.message : 'Failed to load project';
			}
			state.isLoading = false;
		},

		async createProject(title: string, description?: string) {
			const data = await fetchApi<{ project: Project }>('/projects', {
				method: 'POST',
				body: JSON.stringify({ title, description }),
			});
			state.projects = [data.project, ...state.projects];
			return data.project;
		},

		async updateProject(id: string, updates: { title?: string; description?: string }) {
			const data = await fetchApi<{ project: Project }>(`/projects/${id}`, {
				method: 'PUT',
				body: JSON.stringify(updates),
			});
			state.projects = state.projects.map((p) => (p.id === id ? data.project : p));
			if (state.currentProject?.id === id) {
				state.currentProject = data.project;
			}
			return data.project;
		},

		async deleteProject(id: string) {
			await fetchApi(`/projects/${id}`, { method: 'DELETE' });
			state.projects = state.projects.filter((p) => p.id !== id);
			if (state.currentProject?.id === id) {
				state.currentProject = null;
				state.currentBeat = null;
				state.currentLyrics = null;
				state.currentLines = [];
				state.currentMarkers = [];
			}
		},

		async uploadBeat(projectId: string, file: File) {
			// Get upload URL
			const uploadData = await fetchApi<{ beat: Beat; uploadUrl: string }>('/beats/upload', {
				method: 'POST',
				body: JSON.stringify({ projectId, filename: file.name }),
			});

			// Upload file to S3
			await fetch(uploadData.uploadUrl, {
				method: 'PUT',
				body: file,
				headers: { 'Content-Type': file.type },
			});

			state.currentBeat = uploadData.beat;
			return uploadData.beat;
		},

		async updateBeatMetadata(
			beatId: string,
			metadata: { duration?: number; bpm?: number; bpmConfidence?: number; waveformData?: unknown }
		) {
			const data = await fetchApi<{ beat: Beat }>(`/beats/${beatId}/metadata`, {
				method: 'PUT',
				body: JSON.stringify(metadata),
			});
			state.currentBeat = data.beat;
			return data.beat;
		},

		async getBeatDownloadUrl(beatId: string): Promise<string> {
			const data = await fetchApi<{ url: string }>(`/beats/${beatId}/download-url`);
			return data.url;
		},

		async deleteBeat(beatId: string) {
			await fetchApi(`/beats/${beatId}`, { method: 'DELETE' });
			state.currentBeat = null;
			state.currentMarkers = [];
		},

		async checkSttAvailable(): Promise<boolean> {
			try {
				const data = await fetchApi<{ available: boolean }>('/beats/stt/available');
				return data.available;
			} catch {
				return false;
			}
		},

		async transcribeBeat(beatId: string): Promise<{ beat: Beat; lyrics: string | null }> {
			const data = await fetchApi<{ beat: Beat; lyrics: string | null }>(
				`/beats/${beatId}/transcribe`,
				{ method: 'POST' }
			);
			state.currentBeat = data.beat;
			if (data.lyrics) {
				state.currentLyrics = { ...state.currentLyrics!, content: data.lyrics };
			}
			return data;
		},

		async updateLyrics(projectId: string, content: string) {
			const data = await fetchApi<{ lyrics: Lyrics }>(`/lyrics/project/${projectId}`, {
				method: 'POST',
				body: JSON.stringify({ content }),
			});
			state.currentLyrics = data.lyrics;
			return data.lyrics;
		},

		async syncLines(
			lyricsId: string,
			lines: Array<{ lineNumber: number; text: string; startTime?: number; endTime?: number }>
		) {
			const data = await fetchApi<{ lines: LyricLine[] }>(`/lyrics/${lyricsId}/sync`, {
				method: 'POST',
				body: JSON.stringify({ lines }),
			});
			state.currentLines = data.lines;
			return data.lines;
		},

		async updateLineTimestamp(lineId: string, startTime?: number, endTime?: number) {
			const data = await fetchApi<{ line: LyricLine }>(`/lyrics/line/${lineId}/timestamp`, {
				method: 'PUT',
				body: JSON.stringify({ startTime, endTime }),
			});
			state.currentLines = state.currentLines.map((l) => (l.id === lineId ? data.line : l));
			return data.line;
		},

		async createMarker(beatId: string, marker: Omit<Marker, 'id' | 'beatId'>) {
			const data = await fetchApi<{ marker: Marker }>('/markers', {
				method: 'POST',
				body: JSON.stringify({ beatId, ...marker }),
			});
			state.currentMarkers = [...state.currentMarkers, data.marker].sort(
				(a, b) => a.startTime - b.startTime
			);
			return data.marker;
		},

		async updateMarker(markerId: string, updates: Partial<Marker>) {
			const data = await fetchApi<{ marker: Marker }>(`/markers/${markerId}`, {
				method: 'PUT',
				body: JSON.stringify(updates),
			});
			state.currentMarkers = state.currentMarkers.map((m) => (m.id === markerId ? data.marker : m));
			return data.marker;
		},

		async deleteMarker(markerId: string) {
			await fetchApi(`/markers/${markerId}`, { method: 'DELETE' });
			state.currentMarkers = state.currentMarkers.filter((m) => m.id !== markerId);
		},

		clearCurrent() {
			state.currentProject = null;
			state.currentBeat = null;
			state.currentLyrics = null;
			state.currentLines = [];
			state.currentMarkers = [];
		},
	};
}

export const projectStore = createProjectStore();
