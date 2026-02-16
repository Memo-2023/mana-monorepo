import { Injectable, BadRequestException } from '@nestjs/common';
import { ProjectService } from '../project/project.service';
import { BeatService } from '../beat/beat.service';
import { MarkerService } from '../marker/marker.service';
import { LyricsService } from '../lyrics/lyrics.service';
import type { ExportFormat, JsonExportData } from '@lightwrite/shared';

@Injectable()
export class ExportService {
	constructor(
		private projectService: ProjectService,
		private beatService: BeatService,
		private markerService: MarkerService,
		private lyricsService: LyricsService
	) {}

	async exportProject(
		projectId: string,
		userId: string,
		format: ExportFormat
	): Promise<{ content: string; filename: string; contentType: string }> {
		const project = await this.projectService.findByIdOrThrow(projectId, userId);
		const beat = await this.beatService.findByProjectId(projectId);
		const lyricsData = await this.lyricsService.getWithLines(projectId, userId);
		const markerList = beat ? await this.markerService.findByBeatId(beat.id) : [];

		const lines = lyricsData?.lines || [];
		const safeTitle = project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

		switch (format) {
			case 'lrc':
				return {
					content: this.generateLrc(lines, beat?.bpm),
					filename: `${safeTitle}.lrc`,
					contentType: 'text/plain',
				};
			case 'srt':
				return {
					content: this.generateSrt(lines),
					filename: `${safeTitle}.srt`,
					contentType: 'text/plain',
				};
			case 'json':
				return {
					content: this.generateJson(project, beat, markerList, lines),
					filename: `${safeTitle}.json`,
					contentType: 'application/json',
				};
			case 'video':
				throw new BadRequestException(
					'Video export is not yet supported. Use client-side video generation.'
				);
			default:
				throw new BadRequestException(`Unknown export format: ${format}`);
		}
	}

	private formatTime(seconds: number, format: 'lrc' | 'srt'): string {
		const minutes = Math.floor(seconds / 60);
		const secs = seconds % 60;

		if (format === 'lrc') {
			// LRC format: [mm:ss.xx]
			const hundredths = Math.round((secs % 1) * 100);
			const wholeSecs = Math.floor(secs);
			return `[${minutes.toString().padStart(2, '0')}:${wholeSecs.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}]`;
		} else {
			// SRT format: hh:mm:ss,mmm
			const hours = Math.floor(minutes / 60);
			const mins = minutes % 60;
			const millis = Math.round((secs % 1) * 1000);
			const wholeSecs = Math.floor(secs);
			return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${wholeSecs.toString().padStart(2, '0')},${millis.toString().padStart(3, '0')}`;
		}
	}

	private generateLrc(
		lines: Array<{ text: string; startTime?: number | null; lineNumber: number }>,
		bpm?: number | null
	): string {
		const output: string[] = [];

		// Add metadata
		output.push('[ti:LightWrite Export]');
		output.push('[ar:Unknown Artist]');
		if (bpm) {
			output.push(`[bpm:${bpm}]`);
		}
		output.push('');

		// Add synced lines
		for (const line of lines) {
			if (line.startTime !== null && line.startTime !== undefined) {
				const timestamp = this.formatTime(line.startTime, 'lrc');
				output.push(`${timestamp}${line.text}`);
			} else {
				output.push(line.text);
			}
		}

		return output.join('\n');
	}

	private generateSrt(
		lines: Array<{
			text: string;
			startTime?: number | null;
			endTime?: number | null;
			lineNumber: number;
		}>
	): string {
		const output: string[] = [];
		let index = 1;

		for (const line of lines) {
			if (line.startTime !== null && line.startTime !== undefined) {
				const start = this.formatTime(line.startTime, 'srt');
				const end = this.formatTime(line.endTime ?? line.startTime + 3, 'srt');

				output.push(index.toString());
				output.push(`${start} --> ${end}`);
				output.push(line.text);
				output.push('');
				index++;
			}
		}

		return output.join('\n');
	}

	private generateJson(
		project: { id: string; title: string; description?: string | null },
		beat: { bpm?: number | null; duration?: number | null } | null,
		markers: Array<{
			type: string;
			label?: string | null;
			startTime: number;
			endTime?: number | null;
		}>,
		lines: Array<{
			lineNumber: number;
			text: string;
			startTime?: number | null;
			endTime?: number | null;
		}>
	): string {
		const data: JsonExportData = {
			project: {
				id: project.id,
				title: project.title,
				description: project.description || undefined,
			},
			beat: {
				bpm: beat?.bpm || undefined,
				duration: beat?.duration || undefined,
			},
			markers: markers.map((m) => ({
				type: m.type,
				label: m.label || undefined,
				startTime: m.startTime,
				endTime: m.endTime || undefined,
			})),
			lyrics: lines.map((l) => ({
				lineNumber: l.lineNumber,
				text: l.text,
				startTime: l.startTime || undefined,
				endTime: l.endTime || undefined,
			})),
		};

		return JSON.stringify(data, null, 2);
	}
}
