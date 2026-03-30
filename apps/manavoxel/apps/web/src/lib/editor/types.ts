/** Pixel sprite data for items — supports multi-frame animation */
export interface SpriteData {
	pixels: Uint8Array; // RGBA flat array (all frames concatenated)
	width: number;
	height: number;
	frames: number; // number of animation frames (1 = static)
}

/** Get pixel data for a specific frame */
export function getFramePixels(sprite: SpriteData, frame: number): Uint8Array {
	const frameSize = sprite.width * sprite.height * 4;
	const offset = frame * frameSize;
	return sprite.pixels.slice(offset, offset + frameSize);
}

/** Get total frame count */
export function getFrameCount(sprite: SpriteData): number {
	return sprite.frames || 1;
}
