export type ExportFormat = 'lrc' | 'srt' | 'json' | 'video';

export interface ExportOptions {
	format: ExportFormat;
	includeMarkers?: boolean;
	videoOptions?: VideoExportOptions;
}

export interface VideoExportOptions {
	width: number;
	height: number;
	fps: number;
	backgroundColor: string;
	textColor: string;
	highlightColor: string;
	fontFamily: string;
	fontSize: number;
}

export interface LrcExportResult {
	content: string;
	filename: string;
}

export interface SrtExportResult {
	content: string;
	filename: string;
}

export interface JsonExportResult {
	data: JsonExportData;
	filename: string;
}

export interface JsonExportData {
	project: {
		id: string;
		title: string;
		description?: string;
	};
	beat: {
		bpm?: number;
		duration?: number;
	};
	markers: Array<{
		type: string;
		label?: string;
		startTime: number;
		endTime?: number;
	}>;
	lyrics: Array<{
		lineNumber: number;
		text: string;
		startTime?: number;
		endTime?: number;
	}>;
}
