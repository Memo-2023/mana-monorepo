/**
 * Project Store — Mutation + API Operations
 *
 * Reads for project lists are handled by useLiveQuery (see $lib/data/queries.ts).
 * This store handles mutations + API-only operations (beats, lyrics, markers, export).
 * The live queries will automatically pick up local changes.
 */

import type { Project, Beat, Lyrics, LyricLine, Marker } from '@mukke/shared';
import { authStore } from './auth.svelte';
import {
	projectCollection,
	markerCollection,
	type LocalProject,
	type LocalMarker,
} from '$lib/data/local-store';

interface ProjectState {
	currentProject: Project | null;
	currentBeat: Beat | null;
	currentLyrics: Lyrics | null;
	currentLines: LyricLine[];
	currentMarkers: Marker[];
	isLoading: boolean;
	error: string | null;
}

function getBackendUrl(): string {
	let baseUrl = 'http://localhost:3010';
	if (typeof window !== 'undefined') {
		baseUrl =
			(window as unknown as { __PUBLIC_BACKEND_URL__: string }).__PUBLIC_BACKEND_URL__ ||
			'http://localhost:3010';
	}
	// Ensure API prefix is included
	return baseUrl.endsWith('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;
}

function createProjectStore() {
	let state = $state<ProjectState>({
		currentProject: null,
		currentBeat: null,
		currentLyrics: null,
		currentLines: [],
		currentMarkers: [],
		isLoading: false,
		error: null,
	});

	async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
		const authHeaders = await authStore.getAuthHeaders();
		const response = await fetch(`${getBackendUrl()}${path}`, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				...authHeaders,
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

		/** Load project detail from backend (includes beat, lyrics). */
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

		/** Create project — writes to IndexedDB + backend. */
		async createProject(title: string, description?: string) {
			const newLocal: LocalProject = {
				id: crypto.randomUUID(),
				title,
				description: description ?? null,
				songId: null,
			};
			await projectCollection.insert(newLocal);

			try {
				const data = await fetchApi<{ project: Project }>('/projects', {
					method: 'POST',
					body: JSON.stringify({ title, description }),
				});
				return data.project;
			} catch {
				return newLocal as unknown as Project;
			}
		},

		/** Update project — writes to IndexedDB + backend. */
		async updateProject(id: string, updates: { title?: string; description?: string }) {
			const updateData: Partial<LocalProject> = {};
			if (updates.title !== undefined) updateData.title = updates.title;
			if (updates.description !== undefined) updateData.description = updates.description ?? null;
			await projectCollection.update(id, updateData);

			try {
				const data = await fetchApi<{ project: Project }>(`/projects/${id}`, {
					method: 'PUT',
					body: JSON.stringify(updates),
				});
				if (state.currentProject?.id === id) {
					state.currentProject = data.project;
				}
				return data.project;
			} catch {
				return updates as unknown as Project;
			}
		},

		/** Delete project — removes from IndexedDB + backend. */
		async deleteProject(id: string) {
			await projectCollection.delete(id);
			if (state.currentProject?.id === id) {
				state.currentProject = null;
				state.currentBeat = null;
				state.currentLyrics = null;
				state.currentLines = [];
				state.currentMarkers = [];
			}
			try {
				await fetchApi(`/projects/${id}`, { method: 'DELETE' });
			} catch {
				// Sync will reconcile
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

		/** Create marker — writes to IndexedDB + backend. */
		async createMarker(beatId: string, marker: Omit<Marker, 'id' | 'beatId'>) {
			const newLocal: LocalMarker = {
				id: crypto.randomUUID(),
				beatId,
				type: marker.type as LocalMarker['type'],
				label: marker.label ?? null,
				startTime: marker.startTime,
				endTime: marker.endTime ?? null,
				color: marker.color ?? null,
				sortOrder: marker.sortOrder,
			};
			await markerCollection.insert(newLocal);

			try {
				const data = await fetchApi<{ marker: Marker }>('/markers', {
					method: 'POST',
					body: JSON.stringify({ beatId, ...marker }),
				});
				state.currentMarkers = [...state.currentMarkers, data.marker].sort(
					(a, b) => a.startTime - b.startTime
				);
				return data.marker;
			} catch {
				state.currentMarkers = [...state.currentMarkers, newLocal as unknown as Marker].sort(
					(a, b) => a.startTime - b.startTime
				);
				return newLocal as unknown as Marker;
			}
		},

		/** Update marker — writes to IndexedDB + backend. */
		async updateMarker(markerId: string, updates: Partial<Marker>) {
			const updateData: Partial<LocalMarker> = {};
			if (updates.type !== undefined) updateData.type = updates.type as LocalMarker['type'];
			if (updates.label !== undefined) updateData.label = updates.label ?? null;
			if (updates.startTime !== undefined) updateData.startTime = updates.startTime;
			if (updates.endTime !== undefined) updateData.endTime = updates.endTime ?? null;
			if (updates.color !== undefined) updateData.color = updates.color ?? null;
			if (updates.sortOrder !== undefined) updateData.sortOrder = updates.sortOrder;
			await markerCollection.update(markerId, updateData);

			try {
				const data = await fetchApi<{ marker: Marker }>(`/markers/${markerId}`, {
					method: 'PUT',
					body: JSON.stringify(updates),
				});
				state.currentMarkers = state.currentMarkers.map((m) =>
					m.id === markerId ? data.marker : m
				);
				return data.marker;
			} catch {
				return updates as unknown as Marker;
			}
		},

		/** Delete marker — removes from IndexedDB + backend. */
		async deleteMarker(markerId: string) {
			await markerCollection.delete(markerId);
			state.currentMarkers = state.currentMarkers.filter((m) => m.id !== markerId);
			try {
				await fetchApi(`/markers/${markerId}`, { method: 'DELETE' });
			} catch {
				// Sync will reconcile
			}
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
