import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import sharp from 'sharp';

@Injectable()
export class ImageProcessingService implements OnModuleInit {
	private readonly logger = new Logger(ImageProcessingService.name);
	private segmenter: any = null;

	onModuleInit() {
		this.logger.log('RMBG-1.4 model will be lazy-loaded on first use');
	}

	/**
	 * Remove background using RMBG-1.4 AI model, trim, and clean peg-hole artifacts.
	 */
	async removeBackground(pngBuffer: Buffer): Promise<Buffer> {
		if (!this.segmenter) {
			this.logger.log('Loading RMBG-1.4 model (first use)...');
			const { pipeline } = await import('@huggingface/transformers');
			this.segmenter = await pipeline('background-removal', 'briaai/RMBG-1.4');
			this.logger.log('RMBG-1.4 model loaded');
		}

		// HF transformers pipeline needs a file path or URL, not a buffer
		const { writeFile, unlink } = await import('node:fs/promises');
		const { join } = await import('node:path');
		const { tmpdir } = await import('node:os');
		const { randomUUID } = await import('node:crypto');
		const tmpPath = join(tmpdir(), `figgos-rmbg-${randomUUID()}.png`);

		try {
			await writeFile(tmpPath, pngBuffer);
			const result = await this.segmenter(tmpPath);
			const img = Array.isArray(result) ? result[0] : result;

			// Trim transparent borders first so peg-hole coordinates are accurate
			const trimmed = await sharp(Buffer.from(img.data), {
				raw: { width: img.width, height: img.height, channels: img.channels },
			})
				.trim()
				.ensureAlpha()
				.raw()
				.toBuffer({ resolveWithObject: true });

			// Clean leftover white pixels in the peg-hole region (hang tab at top of card)
			this.cleanPegHole(trimmed.data, trimmed.info.width, trimmed.info.height);

			return sharp(trimmed.data, {
				raw: { width: trimmed.info.width, height: trimmed.info.height, channels: 4 },
			})
				.webp({ quality: 85 })
				.toBuffer();
		} finally {
			await unlink(tmpPath).catch(() => {});
		}
	}

	/**
	 * Remove leftover white pixels in the peg-hole region (top 12%, middle 50%).
	 * Uses white-threshold with feathered edge (T=240, feather=10).
	 */
	private cleanPegHole(data: Buffer, width: number, height: number): void {
		const T = 240;
		const F = 10;
		const low = T - F;

		const yEnd = Math.round(height * 0.12);
		const xStart = Math.round(width * 0.25);
		const xEnd = Math.round(width * 0.75);

		for (let y = 0; y < yEnd; y++) {
			for (let x = xStart; x < xEnd; x++) {
				const i = (y * width + x) * 4;
				if (data[i + 3] === 0) continue;
				const m = Math.min(data[i], data[i + 1], data[i + 2]);
				if (m > T) {
					data[i + 3] = 0;
				} else if (m > low) {
					data[i + 3] = Math.min(data[i + 3], Math.round((255 * (T - m)) / F));
				}
			}
		}
	}
}
