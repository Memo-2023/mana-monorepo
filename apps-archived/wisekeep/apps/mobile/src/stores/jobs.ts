import { create } from 'zustand';
import type { TranscriptionJob } from '@/services/api';

interface JobStore {
	jobs: TranscriptionJob[];
	activeJobs: TranscriptionJob[];
	addJob: (job: TranscriptionJob) => void;
	updateJob: (id: string, updates: Partial<TranscriptionJob>) => void;
	removeJob: (id: string) => void;
	setJobs: (jobs: TranscriptionJob[]) => void;
}

export const useJobStore = create<JobStore>((set, get) => ({
	jobs: [],
	activeJobs: [],

	addJob: (job) =>
		set((state) => {
			const jobs = [job, ...state.jobs];
			return {
				jobs,
				activeJobs: jobs.filter(
					(j) => j.status === 'pending' || j.status === 'downloading' || j.status === 'transcribing'
				),
			};
		}),

	updateJob: (id, updates) =>
		set((state) => {
			const jobs = state.jobs.map((j) => (j.id === id ? { ...j, ...updates } : j));
			return {
				jobs,
				activeJobs: jobs.filter(
					(j) => j.status === 'pending' || j.status === 'downloading' || j.status === 'transcribing'
				),
			};
		}),

	removeJob: (id) =>
		set((state) => {
			const jobs = state.jobs.filter((j) => j.id !== id);
			return {
				jobs,
				activeJobs: jobs.filter(
					(j) => j.status === 'pending' || j.status === 'downloading' || j.status === 'transcribing'
				),
			};
		}),

	setJobs: (jobs) =>
		set({
			jobs,
			activeJobs: jobs.filter(
				(j) => j.status === 'pending' || j.status === 'downloading' || j.status === 'transcribing'
			),
		}),
}));
