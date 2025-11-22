/**
 * Integration Tests for UploadModal.tsx
 * Tests the complete video/audio upload flow
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import UploadModal from '../UploadModal';
import * as DocumentPicker from 'expo-document-picker';
import { extractMediaDurationWithFormat } from '~/utils/mediaUtils';

// Mock dependencies
jest.mock('expo-document-picker');
jest.mock('~/utils/mediaUtils');
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' }
  })
}));
jest.mock('~/features/theme/ThemeProvider', () => ({
  useTheme: () => ({
    isDark: false,
    themeVariant: 'default'
  })
}));
jest.mock('~/features/audioRecordingV2', () => ({
  useRecordingLanguage: () => ({
    recordingLanguages: ['en-US'],
    toggleRecordingLanguage: jest.fn(),
    supportedAzureLanguages: {
      'en-US': { nativeName: 'English', emoji: '🇺🇸', locale: 'en-US' },
      'auto': { nativeName: 'Auto Detect', emoji: '🌍', locale: 'auto' }
    }
  })
}));

describe('UploadModal Integration Tests', () => {
  const mockOnClose = jest.fn();
  const mockOnFileUpload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Video file upload flow', () => {
    it('should handle complete video upload workflow', async () => {
      const mockVideoFile = {
        uri: 'file:///path/to/video.mp4',
        name: 'test-video.mp4',
        size: 10240000,
        mimeType: 'video/mp4',
        type: 'success',
        canceled: false,
        assets: [{
          uri: 'file:///path/to/video.mp4',
          name: 'test-video.mp4',
          size: 10240000,
          mimeType: 'video/mp4',
        }]
      };

      // Mock DocumentPicker to return video file
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue(mockVideoFile);

      // Mock duration extraction
      (extractMediaDurationWithFormat as jest.Mock).mockResolvedValue({
        durationMillis: 180000,
        durationSeconds: 180,
        formatted: '3:00'
      });

      const { getByText, findByText } = render(
        <UploadModal
          isVisible={true}
          onClose={mockOnClose}
          onFileUpload={mockOnFileUpload}
          currentLanguage="en"
          isUploading={false}
        />
      );

      // Step 1: Click select file button
      const selectFileButton = getByText('upload.select_file');
      await act(async () => {
        fireEvent.press(selectFileButton);
      });

      // Wait for file selection and duration extraction
      await waitFor(() => {
        expect(DocumentPicker.getDocumentAsync).toHaveBeenCalledWith({
          type: expect.arrayContaining(['video/mp4', 'audio/mpeg']),
          copyToCacheDirectory: true
        });
      });

      await waitFor(() => {
        expect(extractMediaDurationWithFormat).toHaveBeenCalledWith(mockVideoFile.assets[0]);
      });

      // Step 2: Verify file is displayed with duration
      await findByText(/test-video.mp4.*3:00/);

      // Step 3: Trigger upload
      const uploadButton = getByText('upload.upload');
      await act(async () => {
        fireEvent.press(uploadButton);
      });

      // Verify upload was called with correct parameters
      await waitFor(() => {
        expect(mockOnFileUpload).toHaveBeenCalledWith(
          mockVideoFile.assets[0],
          expect.any(String), // language
          expect.anything(), // blueprint
          expect.any(Date), // date
          180000 // duration in milliseconds
        );
      });
    });

    it('should handle MOV video files', async () => {
      const mockMovFile = {
        uri: 'file:///path/to/video.mov',
        name: 'iphone-video.mov',
        size: 15360000,
        mimeType: 'video/quicktime',
        type: 'success',
        canceled: false,
        assets: [{
          uri: 'file:///path/to/video.mov',
          name: 'iphone-video.mov',
          size: 15360000,
          mimeType: 'video/quicktime',
        }]
      };

      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue(mockMovFile);
      (extractMediaDurationWithFormat as jest.Mock).mockResolvedValue({
        durationMillis: 240000,
        durationSeconds: 240,
        formatted: '4:00'
      });

      const { getByText, findByText } = render(
        <UploadModal
          isVisible={true}
          onClose={mockOnClose}
          onFileUpload={mockOnFileUpload}
          currentLanguage="en"
        />
      );

      const selectFileButton = getByText('upload.select_file');
      await act(async () => {
        fireEvent.press(selectFileButton);
      });

      await findByText(/iphone-video.mov.*4:00/);

      expect(extractMediaDurationWithFormat).toHaveBeenCalled();
    });

    it('should handle AVI video files', async () => {
      const mockAviFile = {
        uri: 'file:///path/to/video.avi',
        name: 'screen-recording.avi',
        size: 20480000,
        mimeType: 'video/x-msvideo',
        type: 'success',
        canceled: false,
        assets: [{
          uri: 'file:///path/to/video.avi',
          name: 'screen-recording.avi',
          size: 20480000,
          mimeType: 'video/x-msvideo',
        }]
      };

      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue(mockAviFile);
      (extractMediaDurationWithFormat as jest.Mock).mockResolvedValue({
        durationMillis: 300000,
        durationSeconds: 300,
        formatted: '5:00'
      });

      const { getByText } = render(
        <UploadModal
          isVisible={true}
          onClose={mockOnClose}
          onFileUpload={mockOnFileUpload}
          currentLanguage="en"
        />
      );

      const selectFileButton = getByText('upload.select_file');
      await act(async () => {
        fireEvent.press(selectFileButton);
      });

      await waitFor(() => {
        expect(extractMediaDurationWithFormat).toHaveBeenCalled();
      });
    });
  });

  describe('Audio file upload flow', () => {
    it('should handle MP3 audio files', async () => {
      const mockMp3File = {
        uri: 'file:///path/to/audio.mp3',
        name: 'recording.mp3',
        size: 5120000,
        mimeType: 'audio/mpeg',
        type: 'success',
        canceled: false,
        assets: [{
          uri: 'file:///path/to/audio.mp3',
          name: 'recording.mp3',
          size: 5120000,
          mimeType: 'audio/mpeg',
        }]
      };

      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue(mockMp3File);
      (extractMediaDurationWithFormat as jest.Mock).mockResolvedValue({
        durationMillis: 120000,
        durationSeconds: 120,
        formatted: '2:00'
      });

      const { getByText, findByText } = render(
        <UploadModal
          isVisible={true}
          onClose={mockOnClose}
          onFileUpload={mockOnFileUpload}
          currentLanguage="en"
        />
      );

      const selectFileButton = getByText('upload.select_file');
      await act(async () => {
        fireEvent.press(selectFileButton);
      });

      await findByText(/recording.mp3.*2:00/);
    });

    it('should handle M4A audio files', async () => {
      const mockM4aFile = {
        uri: 'file:///path/to/audio.m4a',
        name: 'voice-memo.m4a',
        size: 3072000,
        mimeType: 'audio/x-m4a',
        type: 'success',
        canceled: false,
        assets: [{
          uri: 'file:///path/to/audio.m4a',
          name: 'voice-memo.m4a',
          size: 3072000,
          mimeType: 'audio/x-m4a',
        }]
      };

      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue(mockM4aFile);
      (extractMediaDurationWithFormat as jest.Mock).mockResolvedValue({
        durationMillis: 90000,
        durationSeconds: 90,
        formatted: '1:30'
      });

      const { getByText, findByText } = render(
        <UploadModal
          isVisible={true}
          onClose={mockOnClose}
          onFileUpload={mockOnFileUpload}
          currentLanguage="en"
        />
      );

      const selectFileButton = getByText('upload.select_file');
      await act(async () => {
        fireEvent.press(selectFileButton);
      });

      await findByText(/voice-memo.m4a.*1:30/);
    });
  });

  describe('Error scenarios', () => {
    it('should handle duration extraction failure', async () => {
      const mockFile = {
        uri: 'file:///path/to/corrupted.mp4',
        name: 'corrupted.mp4',
        size: 5120000,
        mimeType: 'video/mp4',
        type: 'success',
        canceled: false,
        assets: [{
          uri: 'file:///path/to/corrupted.mp4',
          name: 'corrupted.mp4',
          size: 5120000,
          mimeType: 'video/mp4',
        }]
      };

      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue(mockFile);
      (extractMediaDurationWithFormat as jest.Mock).mockRejectedValue(
        new Error('Could not extract media duration')
      );

      const { getByText } = render(
        <UploadModal
          isVisible={true}
          onClose={mockOnClose}
          onFileUpload={mockOnFileUpload}
          currentLanguage="en"
        />
      );

      const selectFileButton = getByText('upload.select_file');
      await act(async () => {
        fireEvent.press(selectFileButton);
      });

      // Wait for error alert
      await waitFor(() => {
        // Alert.alert is called with error message
        expect(extractMediaDurationWithFormat).toHaveBeenCalled();
      });

      // Upload button should remain disabled
      const uploadButton = getByText('upload.upload');
      expect(uploadButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('should prevent upload when no file is selected', () => {
      const { getByText } = render(
        <UploadModal
          isVisible={true}
          onClose={mockOnClose}
          onFileUpload={mockOnFileUpload}
          currentLanguage="en"
        />
      );

      const uploadButton = getByText('upload.upload');
      expect(uploadButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('should prevent upload when duration extraction is in progress', async () => {
      const mockFile = {
        uri: 'file:///path/to/large-video.mp4',
        name: 'large-video.mp4',
        size: 50000000,
        mimeType: 'video/mp4',
        type: 'success',
        canceled: false,
        assets: [{
          uri: 'file:///path/to/large-video.mp4',
          name: 'large-video.mp4',
          size: 50000000,
          mimeType: 'video/mp4',
        }]
      };

      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue(mockFile);

      // Simulate long-running duration extraction
      (extractMediaDurationWithFormat as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          durationMillis: 600000,
          durationSeconds: 600,
          formatted: '10:00'
        }), 5000))
      );

      const { getByText, findByText } = render(
        <UploadModal
          isVisible={true}
          onClose={mockOnClose}
          onFileUpload={mockOnFileUpload}
          currentLanguage="en"
        />
      );

      const selectFileButton = getByText('upload.select_file');
      await act(async () => {
        fireEvent.press(selectFileButton);
      });

      // While extracting, upload should be disabled
      await findByText('upload.extracting_duration');

      const uploadButton = getByText('upload.upload');
      expect(uploadButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('should handle file selection cancellation', async () => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        type: 'cancel',
        canceled: true
      });

      const { getByText } = render(
        <UploadModal
          isVisible={true}
          onClose={mockOnClose}
          onFileUpload={mockOnFileUpload}
          currentLanguage="en"
        />
      );

      const selectFileButton = getByText('upload.select_file');
      await act(async () => {
        fireEvent.press(selectFileButton);
      });

      await waitFor(() => {
        expect(DocumentPicker.getDocumentAsync).toHaveBeenCalled();
      });

      // No file should be selected
      expect(extractMediaDurationWithFormat).not.toHaveBeenCalled();
    });

    it('should handle upload failure gracefully', async () => {
      const mockFile = {
        uri: 'file:///path/to/video.mp4',
        name: 'test-video.mp4',
        size: 10240000,
        mimeType: 'video/mp4',
        type: 'success',
        canceled: false,
        assets: [{
          uri: 'file:///path/to/video.mp4',
          name: 'test-video.mp4',
          size: 10240000,
          mimeType: 'video/mp4',
        }]
      };

      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue(mockFile);
      (extractMediaDurationWithFormat as jest.Mock).mockResolvedValue({
        durationMillis: 180000,
        durationSeconds: 180,
        formatted: '3:00'
      });

      // Mock upload failure
      mockOnFileUpload.mockRejectedValue(new Error('Network error'));

      const { getByText, findByText } = render(
        <UploadModal
          isVisible={true}
          onClose={mockOnClose}
          onFileUpload={mockOnFileUpload}
          currentLanguage="en"
        />
      );

      const selectFileButton = getByText('upload.select_file');
      await act(async () => {
        fireEvent.press(selectFileButton);
      });

      await findByText(/test-video.mp4.*3:00/);

      const uploadButton = getByText('upload.upload');
      await act(async () => {
        fireEvent.press(uploadButton);
      });

      // Modal should remain open on error
      await waitFor(() => {
        expect(mockOnFileUpload).toHaveBeenCalled();
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });
  });

  describe('Language selection', () => {
    it('should allow language selection for video upload', async () => {
      const mockFile = {
        uri: 'file:///path/to/video.mp4',
        name: 'test-video.mp4',
        size: 10240000,
        mimeType: 'video/mp4',
        type: 'success',
        canceled: false,
        assets: [{
          uri: 'file:///path/to/video.mp4',
          name: 'test-video.mp4',
          size: 10240000,
          mimeType: 'video/mp4',
        }]
      };

      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue(mockFile);
      (extractMediaDurationWithFormat as jest.Mock).mockResolvedValue({
        durationMillis: 180000,
        durationSeconds: 180,
        formatted: '3:00'
      });

      const { getByText, findByText } = render(
        <UploadModal
          isVisible={true}
          onClose={mockOnClose}
          onFileUpload={mockOnFileUpload}
          currentLanguage="en"
        />
      );

      // Select file
      const selectFileButton = getByText('upload.select_file');
      await act(async () => {
        fireEvent.press(selectFileButton);
      });

      await findByText(/test-video.mp4/);

      // Open language selector
      const languageButton = getByText('upload.select_language');
      await act(async () => {
        fireEvent.press(languageButton);
      });

      // Verify language options are displayed
      await findByText('English');
    });
  });

  describe('Upload state management', () => {
    it('should disable interactions during upload', async () => {
      const { getByText, rerender } = render(
        <UploadModal
          isVisible={true}
          onClose={mockOnClose}
          onFileUpload={mockOnFileUpload}
          currentLanguage="en"
          isUploading={false}
        />
      );

      // Rerender with isUploading=true
      rerender(
        <UploadModal
          isVisible={true}
          onClose={mockOnClose}
          onFileUpload={mockOnFileUpload}
          currentLanguage="en"
          isUploading={true}
        />
      );

      await waitFor(() => {
        expect(getByText('upload.uploading')).toBeTruthy();
      });

      // Close button should be disabled
      const cancelButton = getByText('common.cancel');
      expect(cancelButton.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('Date and time selection', () => {
    it('should allow custom date selection for video upload', async () => {
      const mockFile = {
        uri: 'file:///path/to/video.mp4',
        name: 'test-video.mp4',
        size: 10240000,
        mimeType: 'video/mp4',
        type: 'success',
        canceled: false,
        assets: [{
          uri: 'file:///path/to/video.mp4',
          name: 'test-video.mp4',
          size: 10240000,
          mimeType: 'video/mp4',
        }]
      };

      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue(mockFile);
      (extractMediaDurationWithFormat as jest.Mock).mockResolvedValue({
        durationMillis: 180000,
        durationSeconds: 180,
        formatted: '3:00'
      });

      const { getByText, findByText } = render(
        <UploadModal
          isVisible={true}
          onClose={mockOnClose}
          onFileUpload={mockOnFileUpload}
          currentLanguage="en"
        />
      );

      // Select file
      const selectFileButton = getByText('upload.select_file');
      await act(async () => {
        fireEvent.press(selectFileButton);
      });

      await findByText(/test-video.mp4/);

      // Open date selector
      const dateButton = getByText('upload.select_date');
      fireEvent.press(dateButton);

      // Verify date picker is displayed
      await waitFor(() => {
        expect(getByText('upload.select_date')).toBeTruthy();
      });
    });
  });
});
