/**
 * Unit Tests for mediaUtils.ts
 * Tests video/audio file validation and duration extraction
 */

import {
  isSupportedMediaFile,
  extractMediaDuration,
  extractMediaDurationWithFormat,
  formatDuration
} from '../mediaUtils';
import * as DocumentPicker from 'expo-document-picker';

describe('mediaUtils', () => {
  describe('isSupportedMediaFile', () => {
    describe('Audio formats', () => {
      it('should validate MP3 audio files', () => {
        const mockFile: DocumentPicker.DocumentPickerAsset = {
          uri: 'file:///path/to/audio.mp3',
          name: 'audio.mp3',
          size: 1024000,
          mimeType: 'audio/mpeg',
          file: null
        };

        expect(isSupportedMediaFile(mockFile)).toBe(true);
      });

      it('should validate M4A audio files', () => {
        const mockFile: DocumentPicker.DocumentPickerAsset = {
          uri: 'file:///path/to/audio.m4a',
          name: 'audio.m4a',
          size: 1024000,
          mimeType: 'audio/x-m4a',
          file: null
        };

        expect(isSupportedMediaFile(mockFile)).toBe(true);
      });

      it('should validate WAV audio files', () => {
        const mockFile: DocumentPicker.DocumentPickerAsset = {
          uri: 'file:///path/to/audio.wav',
          name: 'audio.wav',
          size: 1024000,
          mimeType: 'audio/wav',
          file: null
        };

        expect(isSupportedMediaFile(mockFile)).toBe(true);
      });

      it('should validate AAC audio files', () => {
        const mockFile: DocumentPicker.DocumentPickerAsset = {
          uri: 'file:///path/to/audio.aac',
          name: 'audio.aac',
          size: 1024000,
          mimeType: 'audio/aac',
          file: null
        };

        expect(isSupportedMediaFile(mockFile)).toBe(true);
      });

      it('should validate OGG audio files', () => {
        const mockFile: DocumentPicker.DocumentPickerAsset = {
          uri: 'file:///path/to/audio.ogg',
          name: 'audio.ogg',
          size: 1024000,
          mimeType: 'audio/ogg',
          file: null
        };

        expect(isSupportedMediaFile(mockFile)).toBe(true);
      });
    });

    describe('Video formats', () => {
      it('should validate MP4 video files', () => {
        const mockFile: DocumentPicker.DocumentPickerAsset = {
          uri: 'file:///path/to/video.mp4',
          name: 'video.mp4',
          size: 5024000,
          mimeType: 'video/mp4',
          file: null
        };

        expect(isSupportedMediaFile(mockFile)).toBe(true);
      });

      it('should validate MOV video files', () => {
        const mockFile: DocumentPicker.DocumentPickerAsset = {
          uri: 'file:///path/to/video.mov',
          name: 'video.mov',
          size: 5024000,
          mimeType: 'video/quicktime',
          file: null
        };

        expect(isSupportedMediaFile(mockFile)).toBe(true);
      });

      it('should validate AVI video files', () => {
        const mockFile: DocumentPicker.DocumentPickerAsset = {
          uri: 'file:///path/to/video.avi',
          name: 'video.avi',
          size: 5024000,
          mimeType: 'video/x-msvideo',
          file: null
        };

        expect(isSupportedMediaFile(mockFile)).toBe(true);
      });

      it('should validate M4V video files', () => {
        const mockFile: DocumentPicker.DocumentPickerAsset = {
          uri: 'file:///path/to/video.m4v',
          name: 'video.m4v',
          size: 5024000,
          mimeType: 'video/x-m4v',
          file: null
        };

        expect(isSupportedMediaFile(mockFile)).toBe(true);
      });

      it('should validate MPEG video files', () => {
        const mockFile: DocumentPicker.DocumentPickerAsset = {
          uri: 'file:///path/to/video.mpeg',
          name: 'video.mpeg',
          size: 5024000,
          mimeType: 'video/mpeg',
          file: null
        };

        expect(isSupportedMediaFile(mockFile)).toBe(true);
      });

      it('should validate MPG video files', () => {
        const mockFile: DocumentPicker.DocumentPickerAsset = {
          uri: 'file:///path/to/video.mpg',
          name: 'video.mpg',
          size: 5024000,
          mimeType: 'video/mpeg',
          file: null
        };

        expect(isSupportedMediaFile(mockFile)).toBe(true);
      });
    });

    describe('Edge cases and invalid formats', () => {
      it('should reject unsupported file extensions', () => {
        const mockFile: DocumentPicker.DocumentPickerAsset = {
          uri: 'file:///path/to/document.pdf',
          name: 'document.pdf',
          size: 1024000,
          mimeType: 'application/pdf',
          file: null
        };

        expect(isSupportedMediaFile(mockFile)).toBe(false);
      });

      it('should reject files without mime type or extension', () => {
        const mockFile: DocumentPicker.DocumentPickerAsset = {
          uri: 'file:///path/to/unknown',
          name: 'unknown',
          size: 1024000,
          mimeType: null,
          file: null
        };

        expect(isSupportedMediaFile(mockFile)).toBe(false);
      });

      it('should handle files with missing name property', () => {
        const mockFile: DocumentPicker.DocumentPickerAsset = {
          uri: 'file:///path/to/file',
          name: null as any,
          size: 1024000,
          mimeType: 'video/mp4',
          file: null
        };

        // Should still validate based on mimeType
        expect(isSupportedMediaFile(mockFile)).toBe(true);
      });

      it('should handle files with case-insensitive extensions', () => {
        const mockFile: DocumentPicker.DocumentPickerAsset = {
          uri: 'file:///path/to/VIDEO.MP4',
          name: 'VIDEO.MP4',
          size: 5024000,
          mimeType: null,
          file: null
        };

        expect(isSupportedMediaFile(mockFile)).toBe(true);
      });

      it('should validate by extension when mimeType is generic', () => {
        const mockFile: DocumentPicker.DocumentPickerAsset = {
          uri: 'file:///path/to/audio.mp3',
          name: 'audio.mp3',
          size: 1024000,
          mimeType: 'application/octet-stream',
          file: null
        };

        expect(isSupportedMediaFile(mockFile)).toBe(true);
      });
    });
  });

  describe('formatDuration', () => {
    it('should format duration less than an hour correctly', () => {
      expect(formatDuration(150000)).toBe('2:30'); // 2 min 30 sec
    });

    it('should format duration with seconds padding', () => {
      expect(formatDuration(65000)).toBe('1:05'); // 1 min 5 sec
    });

    it('should format duration over an hour correctly', () => {
      expect(formatDuration(3665000)).toBe('1:01:05'); // 1 hour 1 min 5 sec
    });

    it('should handle zero duration', () => {
      expect(formatDuration(0)).toBe('0:00');
    });

    it('should handle very long durations', () => {
      expect(formatDuration(7200000)).toBe('2:00:00'); // 2 hours exactly
    });

    it('should floor milliseconds correctly', () => {
      expect(formatDuration(60999)).toBe('1:00'); // Should floor to 60 seconds = 1:00
    });
  });

  describe('extractMediaDuration', () => {
    describe('Web platform', () => {
      beforeEach(() => {
        // Mock Platform.OS to be 'web'
        jest.mock('react-native', () => ({
          Platform: { OS: 'web' }
        }));
      });

      it('should extract duration from audio file on web', async () => {
        // Create mock HTML5 Audio element
        const mockAudioElement = {
          preload: '',
          duration: 120.5,
          src: '',
          remove: jest.fn(),
          onloadedmetadata: null,
          onerror: null,
        };

        const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockAudioElement as any);
        const createObjectURLSpy = jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
        const revokeObjectURLSpy = jest.spyOn(URL, 'revokeObjectURL').mockImplementation();

        const mockFile: DocumentPicker.DocumentPickerAsset = {
          uri: 'file:///path/to/audio.mp3',
          name: 'audio.mp3',
          size: 1024000,
          mimeType: 'audio/mpeg',
          file: new Blob(['test data'], { type: 'audio/mpeg' }) as any
        };

        const promise = extractMediaDuration(mockFile);

        // Simulate metadata loaded
        if (mockAudioElement.onloadedmetadata) {
          mockAudioElement.onloadedmetadata(null as any);
        }

        const duration = await promise;

        expect(duration).toBe(120500); // 120.5 seconds in milliseconds
        expect(createElementSpy).toHaveBeenCalledWith('audio');
        expect(createObjectURLSpy).toHaveBeenCalled();
        expect(revokeObjectURLSpy).toHaveBeenCalled();

        createElementSpy.mockRestore();
        createObjectURLSpy.mockRestore();
        revokeObjectURLSpy.mockRestore();
      });

      it('should extract duration from video file on web', async () => {
        const mockVideoElement = {
          preload: '',
          duration: 180.75,
          src: '',
          remove: jest.fn(),
          onloadedmetadata: null,
          onerror: null,
        };

        const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockVideoElement as any);
        const createObjectURLSpy = jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
        const revokeObjectURLSpy = jest.spyOn(URL, 'revokeObjectURL').mockImplementation();

        const mockFile: DocumentPicker.DocumentPickerAsset = {
          uri: 'file:///path/to/video.mp4',
          name: 'video.mp4',
          size: 5024000,
          mimeType: 'video/mp4',
          file: new Blob(['test data'], { type: 'video/mp4' }) as any
        };

        const promise = extractMediaDuration(mockFile);

        if (mockVideoElement.onloadedmetadata) {
          mockVideoElement.onloadedmetadata(null as any);
        }

        const duration = await promise;

        expect(duration).toBe(180750); // 180.75 seconds in milliseconds
        expect(createElementSpy).toHaveBeenCalledWith('video');

        createElementSpy.mockRestore();
        createObjectURLSpy.mockRestore();
        revokeObjectURLSpy.mockRestore();
      });

      it('should reject if duration is invalid on web', async () => {
        const mockAudioElement = {
          preload: '',
          duration: NaN,
          src: '',
          remove: jest.fn(),
          onloadedmetadata: null,
          onerror: null,
        };

        const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockAudioElement as any);
        const createObjectURLSpy = jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
        const revokeObjectURLSpy = jest.spyOn(URL, 'revokeObjectURL').mockImplementation();

        const mockFile: DocumentPicker.DocumentPickerAsset = {
          uri: 'file:///path/to/audio.mp3',
          name: 'audio.mp3',
          size: 1024000,
          mimeType: 'audio/mpeg',
          file: new Blob(['test data'], { type: 'audio/mpeg' }) as any
        };

        const promise = extractMediaDuration(mockFile);

        if (mockAudioElement.onloadedmetadata) {
          mockAudioElement.onloadedmetadata(null as any);
        }

        await expect(promise).rejects.toThrow('Invalid or zero duration');

        createElementSpy.mockRestore();
        createObjectURLSpy.mockRestore();
        revokeObjectURLSpy.mockRestore();
      });

      it('should reject on load error on web', async () => {
        const mockAudioElement = {
          preload: '',
          duration: 120,
          src: '',
          remove: jest.fn(),
          onloadedmetadata: null,
          onerror: null,
        };

        const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockAudioElement as any);
        const createObjectURLSpy = jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
        const revokeObjectURLSpy = jest.spyOn(URL, 'revokeObjectURL').mockImplementation();

        const mockFile: DocumentPicker.DocumentPickerAsset = {
          uri: 'file:///path/to/audio.mp3',
          name: 'audio.mp3',
          size: 1024000,
          mimeType: 'audio/mpeg',
          file: new Blob(['test data'], { type: 'audio/mpeg' }) as any
        };

        const promise = extractMediaDuration(mockFile);

        if (mockAudioElement.onerror) {
          mockAudioElement.onerror(new Error('Load failed') as any);
        }

        await expect(promise).rejects.toThrow('Failed to load media file');

        createElementSpy.mockRestore();
        createObjectURLSpy.mockRestore();
        revokeObjectURLSpy.mockRestore();
      });
    });
  });

  describe('extractMediaDurationWithFormat', () => {
    it('should return duration with formatted string', async () => {
      // Mock Platform.OS to be 'web'
      jest.mock('react-native', () => ({
        Platform: { OS: 'web' }
      }));

      const mockAudioElement = {
        preload: '',
        duration: 150.5,
        src: '',
        remove: jest.fn(),
        onloadedmetadata: null,
        onerror: null,
      };

      const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockAudioElement as any);
      const createObjectURLSpy = jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
      const revokeObjectURLSpy = jest.spyOn(URL, 'revokeObjectURL').mockImplementation();

      const mockFile: DocumentPicker.DocumentPickerAsset = {
        uri: 'file:///path/to/audio.mp3',
        name: 'audio.mp3',
        size: 1024000,
        mimeType: 'audio/mpeg',
        file: new Blob(['test data'], { type: 'audio/mpeg' }) as any
      };

      const promise = extractMediaDurationWithFormat(mockFile);

      if (mockAudioElement.onloadedmetadata) {
        mockAudioElement.onloadedmetadata(null as any);
      }

      const result = await promise;

      expect(result).toHaveProperty('durationMillis', 150500);
      expect(result).toHaveProperty('durationSeconds', 150);
      expect(result).toHaveProperty('formatted', '2:30');

      createElementSpy.mockRestore();
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });
  });

  describe('Security and validation', () => {
    it('should reject potentially malicious file extensions', () => {
      const maliciousFiles = [
        'script.exe',
        'malware.bat',
        'virus.sh',
        'trojan.com',
        'payload.dll'
      ];

      maliciousFiles.forEach(filename => {
        const mockFile: DocumentPicker.DocumentPickerAsset = {
          uri: `file:///path/to/${filename}`,
          name: filename,
          size: 1024000,
          mimeType: 'application/octet-stream',
          file: null
        };

        expect(isSupportedMediaFile(mockFile)).toBe(false);
      });
    });

    it('should handle extremely long file names', () => {
      const longName = 'a'.repeat(1000) + '.mp4';
      const mockFile: DocumentPicker.DocumentPickerAsset = {
        uri: `file:///path/to/${longName}`,
        name: longName,
        size: 5024000,
        mimeType: 'video/mp4',
        file: null
      };

      expect(isSupportedMediaFile(mockFile)).toBe(true);
    });

    it('should handle files with special characters in name', () => {
      const specialName = 'test_file-video (1) [HD].mp4';
      const mockFile: DocumentPicker.DocumentPickerAsset = {
        uri: `file:///path/to/${specialName}`,
        name: specialName,
        size: 5024000,
        mimeType: 'video/mp4',
        file: null
      };

      expect(isSupportedMediaFile(mockFile)).toBe(true);
    });
  });

  describe('Performance tests', () => {
    it('should validate file format quickly', () => {
      const mockFile: DocumentPicker.DocumentPickerAsset = {
        uri: 'file:///path/to/video.mp4',
        name: 'video.mp4',
        size: 5024000,
        mimeType: 'video/mp4',
        file: null
      };

      const start = performance.now();
      isSupportedMediaFile(mockFile);
      const duration = performance.now() - start;

      // Should complete in less than 1ms
      expect(duration).toBeLessThan(1);
    });

    it('should format duration quickly', () => {
      const start = performance.now();
      formatDuration(7200000);
      const duration = performance.now() - start;

      // Should complete in less than 1ms
      expect(duration).toBeLessThan(1);
    });
  });
});
