declare const __BUILD_HASH__: string;
declare const __BUILD_TIME__: string;

declare module 'butterchurn' {
	interface ButterchurnVisualizer {
		connectAudio(source: AudioNode): void;
		disconnectAudio(source: AudioNode): void;
		loadPreset(preset: Record<string, unknown>, blendTime?: number): void;
		render(opts?: Record<string, unknown>): void;
		setRendererSize(width: number, height: number, opts?: Record<string, unknown>): void;
		setInternalMeshSize(width: number, height: number): void;
		setOutputAA(useAA: boolean): void;
		setCanvas(canvas: HTMLCanvasElement): void;
		launchSongTitleAnim(text: string): void;
		toDataURL(): string;
		loseGLContext(): void;
	}

	interface ButterchurnOptions {
		width: number;
		height: number;
		pixelRatio?: number;
		textureRatio?: number;
	}

	interface Butterchurn {
		createVisualizer(
			audioContext: AudioContext,
			canvas: HTMLCanvasElement,
			options: ButterchurnOptions
		): ButterchurnVisualizer;
	}

	const butterchurn: Butterchurn;
	export default butterchurn;
}

declare module 'butterchurn-presets' {
	function getPresets(): Record<string, Record<string, unknown>>;
	export default getPresets;
}
