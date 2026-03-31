# Audio Microservice Changelog

## [Unreleased]

### Added
- Service-to-service authentication using Supabase service role keys
- Support for `MEMORO_SUPABASE_SERVICE_KEY` environment variable
- UserId parameter in batch metadata updates for ownership validation

### Changed
- All memoro service callbacks now use dedicated `/service/` endpoints
- Authentication uses service role key instead of user JWT tokens
- Updated callback methods:
  - `notifyTranscriptionComplete`: Now calls `/memoro/service/transcription-completed`
  - `notifyAppendTranscriptionComplete`: Now calls `/memoro/service/append-transcription-completed`
  - `storeBatchJobMetadata`: Now calls `/memoro/service/update-batch-metadata`

### Fixed
- 401 authentication errors when calling memoro service
- Callbacks no longer fail due to expired user tokens
- Service-to-service communication is now independent of user sessions

### Security
- Service role keys are never exposed to clients
- All service-to-service communication uses HTTPS
- Environment variables store sensitive credentials