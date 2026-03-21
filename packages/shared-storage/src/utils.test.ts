import { describe, it, expect } from 'vitest';
import { getContentType, validateFileExtension, AUDIO_EXTENSIONS } from './utils';

describe('getContentType', () => {
	describe('audio formats', () => {
		const audioMappings: [string, string][] = [
			['.mp3', 'audio/mpeg'],
			['.wav', 'audio/wav'],
			['.ogg', 'audio/ogg'],
			['.m4a', 'audio/mp4'],
			['.aac', 'audio/aac'],
			['.flac', 'audio/flac'],
			['.aiff', 'audio/aiff'],
			['.aif', 'audio/aiff'],
			['.opus', 'audio/opus'],
			['.wma', 'audio/x-ms-wma'],
			['.alac', 'audio/mp4'],
			['.ape', 'audio/x-ape'],
			['.wv', 'audio/x-wavpack'],
			['.dsf', 'audio/dsf'],
			['.dff', 'audio/dff'],
		];

		it.each(audioMappings)('%s → %s', (ext, expected) => {
			expect(getContentType(`song${ext}`)).toBe(expected);
		});

		it('handles uppercase extensions', () => {
			expect(getContentType('song.FLAC')).toBe('audio/flac');
			expect(getContentType('song.M4A')).toBe('audio/mp4');
		});

		it('returns application/octet-stream for unknown extensions', () => {
			expect(getContentType('song.xyz')).toBe('application/octet-stream');
		});
	});
});

describe('AUDIO_EXTENSIONS', () => {
	it('contains all common audio formats', () => {
		const expected = [
			'.mp3',
			'.wav',
			'.ogg',
			'.m4a',
			'.aac',
			'.flac',
			'.aiff',
			'.aif',
			'.opus',
			'.wma',
			'.webm',
			'.alac',
			'.ape',
			'.wv',
			'.dsf',
			'.dff',
		];
		for (const ext of expected) {
			expect(AUDIO_EXTENSIONS).toContain(ext);
		}
	});
});

describe('validateFileExtension', () => {
	it('validates audio files against AUDIO_EXTENSIONS', () => {
		expect(validateFileExtension('song.flac', AUDIO_EXTENSIONS)).toBe(true);
		expect(validateFileExtension('song.mp3', AUDIO_EXTENSIONS)).toBe(true);
		expect(validateFileExtension('song.opus', AUDIO_EXTENSIONS)).toBe(true);
		expect(validateFileExtension('song.exe', AUDIO_EXTENSIONS)).toBe(false);
		expect(validateFileExtension('song.pdf', AUDIO_EXTENSIONS)).toBe(false);
	});
});
