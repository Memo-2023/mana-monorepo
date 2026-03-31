# Enhanced Audio & Video Transcription Microservice

NestJS microservice for advanced audio and video processing with transcription. Features dual routing: fast real-time processing and enhanced Azure Batch transcription for long files.

## 🎯 What It Does

### Audio Processing
- **Receives audio file** uploads (MP3, WAV, M4A, AAC, OGG, WebM, FLAC)
- **Validates format** and file size (50MB max)
- **Converts to Azure-compatible WAV format** using FFmpeg
- **Enhanced diarization** with up to 10 speaker detection
- **Multi-language support** with automatic language identification and smart fallback
- **Uploads to Azure Blob Storage** with SAS tokens
- **Starts Azure Batch transcription** with advanced speaker processing
- **Recovery tracking** via memo metadata storage
- **Returns job ID** for tracking and recovery

### Video Processing (NEW)
- **Extracts audio from video files** (MP4, MOV, AVI, MKV, WEBM, FLV, WMV)
- **Automatic video-to-audio conversion** using FFmpeg
- **High-quality audio extraction** optimized for speech recognition
- **Supports all video formats** with audio tracks
- **Smart routing** (fast <115min, batch ≥115min) based on extracted audio duration
- **Full transcription pipeline** with speaker diarization
- **Progress tracking** and error handling

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Azure credentials

# Start development server
npm run start:dev
# Service runs on port 1337
```

## 📡 API Endpoints

### Process Video File (NEW)
```bash
POST /audio/process-video
Content-Type: application/json
Authorization: Bearer <token>

curl -X POST http://localhost:1337/audio/process-video \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "videoPath": "user123/memo456/video.mp4",
    "memoId": "memo456",
    "userId": "user123",
    "spaceId": "space789",
    "recordingLanguages": ["en-US", "de-DE"],
    "enableDiarization": true
  }'
```

**Supported formats:** MP4, MOV, AVI, MKV, WEBM, FLV, WMV, MPEG
**Required Authentication:** Bearer JWT token
**Fields:**
- `videoPath` (required) - Supabase storage path to video file
- `memoId` (required) - Memo identifier
- `userId` (required) - User identifier
- `spaceId` (optional) - Space identifier
- `recordingLanguages` (optional) - Array of language codes
- `enableDiarization` (optional) - Enable speaker detection (default: true)

**Response:**
```json
{
  "success": true,
  "route": "fast",
  "source": "video",
  "memoId": "memo456",
  "message": "Video processed and transcribed successfully via fast route"
}
```

### Upload Audio for Batch Transcription
```bash
POST /audio/transcribe
Content-Type: multipart/form-data

curl -X POST http://localhost:1337/audio/transcribe \
  -F "audio=@your-audio-file.m4a" \
  -F "userId=user123" \
  -F "spaceId=space456"
```

**Supported formats:** MP3, WAV, M4A, AAC, OGG, WebM, FLAC
**Max file size:** 50MB
**Fields:**
- `audio` (required) - Audio file
- `userId` (optional) - User identifier
- `spaceId` (optional) - Space identifier

### Convert and Transcribe (with Supabase Integration)
```bash
POST /audio/convert-and-transcribe
Content-Type: multipart/form-data
Authorization: Bearer <token>

curl -X POST http://localhost:1337/audio/convert-and-transcribe \
  -H "Authorization: Bearer your-jwt-token" \
  -F "audio=@your-audio-file.m4a" \
  -F "audioPath=user123/memo456/audio.m4a" \
  -F "memoId=memo456" \
  -F "recordingLanguages=en-US,es-ES"
```

**Required Authentication:** Bearer JWT token  
**Fields:**
- `audio` (required) - Audio file
- `audioPath` (required) - Supabase storage path
- `memoId` (required) - Memo identifier
- `recordingLanguages` (optional) - Comma-separated language codes (if not provided, auto-detects from 10 common languages)

## 📊 Response Examples

### Success Response
```json
{
  "status": "processing",
  "type": "batch", 
  "jobId": "azure-batch-job-123",
  "userId": "user123",
  "spaceId": "space456",
  "duration": 3600.5,
  "message": "Batch transcription started. Webhook will notify when complete."
}
```

### Error Response
```json
{
  "status": "failed",
  "message": "Azure Storage credentials not configured",
  "type": "batch",
  "jobId": null,
  "userId": "user123",
  "spaceId": "space456"
}
```

## ⚙️ Configuration

Required environment variables:

```env
# Azure Configuration
AZURE_SPEECH_KEY=your-azure-speech-key
AZURE_SPEECH_REGION=swedencentral
AZURE_STORAGE_ACCOUNT_NAME=your-storage-account  
AZURE_STORAGE_ACCOUNT_KEY=your-storage-key

# Supabase Configuration
SUPABASE_URL=https://npgifbrwhftlbrbaglmi.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_ANON_KEY=your-anon-key

# Memoro Service Integration
MEMORO_SERVICE_URL=https://memoro-service-111768794939.europe-west3.run.app

# Server Configuration
PORT=1337
```

## 🐳 Docker

```bash
# Build image
docker build -t audio-microservice .

# Run container  
docker run -p 1337:1337 --env-file .env audio-microservice
```

## 🔄 How It Works

### Enhanced Batch Transcription Route (`/audio/transcribe-from-storage`)
1. **Storage Download** → Download audio file from Supabase Storage
2. **Duration Analysis** → Calculate audio length using FFmpeg  
3. **Convert** → FFmpeg converts to Azure-compatible WAV (PCM 16-bit LE, 16kHz mono)
4. **Upload** → Store in Azure Blob Storage with 6-hour SAS token
5. **Enhanced Batch Job** → Create Azure Speech batch transcription job with:
   - **Advanced diarization** (up to 10 speakers)
   - **Smart language identification** with fallback to 10 common languages when auto mode is used
   - **Word-level timestamps**
   - **Webhook callback configuration**
6. **Metadata Storage** → Store jobId in memo metadata for recovery tracking
7. **Response** → Return job ID and processing status

### Fast Transcription Route (`/audio/convert-and-transcribe-from-storage`)
1. **Authentication** → Validate Bearer JWT token
2. **Storage Download** → Download audio from Supabase Storage
3. **Duration Analysis** → Calculate audio length using FFmpeg
4. **Convert** → Convert to WAV format if needed
5. **Supabase Upload** → Store converted audio in Supabase Storage (overwrite original)
6. **Edge Function** → Call Supabase transcribe function for real-time processing
7. **Response** → Return transcription results or processing status

### Recovery System
- **Metadata Tracking** → Each batch job stores jobId in memo metadata using direct memo ID lookup (improved 2025-06-08)
- **Authentication Fixed** → Proper JWT token handling for metadata storage (fixed 2025-06-08)
- **Webhook Failure Recovery** → Planned cron job system for stuck transcriptions
- **Status Monitoring** → Integration with memoro-service for batch job tracking

## 🌍 Language Detection

The service supports intelligent language detection with two modes:

### Specific Language Mode
When `recordingLanguages` is provided, Azure will attempt to identify the language from the specified list:
```bash
# Example: Detect Spanish or English
-F "recordingLanguages=es-ES,en-US"
```

### Auto Mode (Smart Fallback)
When no `recordingLanguages` are provided, the service automatically uses a curated list of 10 common languages:
- `de-DE` (German)
- `en-GB` (English - UK)
- `fr-FR` (French)
- `it-IT` (Italian) 
- `es-ES` (Spanish)
- `sv-SE` (Swedish)
- `ru-RU` (Russian)
- `nl-NL` (Dutch)
- `tr-TR` (Turkish)
- `pt-PT` (Portuguese)

This ensures reliable language detection even when the frontend is in auto mode, improving transcription accuracy across different languages.

## 🔧 Integration Example

```javascript
// Call from another microservice
const formData = new FormData();
formData.append('audio', audioFileBuffer);
formData.append('userId', 'user123');
formData.append('spaceId', 'space456');

const response = await fetch('http://localhost:1337/audio/transcribe', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log('Job ID:', result.jobId);
```

Optimized for long audio files with Azure Batch transcription! 🎵

example response: {"status":"processing","type":"batch","jobId":"287e93a0-3065-487d-9a22-36c3cfb5e1dc","userId":"test-user","duration":2407.119819,"message":"Batch transcription started. Webhook will notify when complete."}

Service URL: https://audio-microservice-111768794939.europe-west3.run.app# audio-middleware
# Deployment test Sat Jul 26 19:26:53 CEST 2025


test