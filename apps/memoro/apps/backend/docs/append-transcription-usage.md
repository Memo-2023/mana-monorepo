# Append Transcription Usage Example

## Overview
The append-transcription endpoint allows you to add additional audio recordings to an existing memo and have them transcribed. This is useful when users want to add follow-up thoughts or additional content to a memo without creating a new one.

## Frontend Integration Example

```typescript
// Example: Adding an additional recording to an existing memo

async function appendAudioToMemo(
  memoId: string,
  audioFile: File,
  recordingDuration: number
) {
  try {
    // 1. Upload audio file to Supabase storage (similar to main recording)
    const filePath = `${userId}/recordings/${Date.now()}_append.webm`;
    const { error: uploadError } = await supabase.storage
      .from('user-uploads')
      .upload(filePath, audioFile);

    if (uploadError) {
      throw uploadError;
    }

    // 2. Call the append-transcription endpoint
    const response = await fetch(`${MEMORO_SERVICE_URL}/memoro/append-transcription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        memoId: memoId,
        filePath: filePath,
        duration: recordingDuration,
        recordingLanguages: ['de-DE', 'en-US'], // Optional: user's selected languages
        enableDiarization: true // Optional: enable speaker detection
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to append transcription');
    }

    const result = await response.json();
    console.log('Append transcription started:', result);

    // The memo will be updated asynchronously
    // You can listen to real-time updates or poll for status
    
    return result;
  } catch (error) {
    console.error('Error appending audio to memo:', error);
    throw error;
  }
}
```

## Response Format

### Success Response
```json
{
  "success": true,
  "memoId": "uuid-here",
  "filePath": "userId/recordings/timestamp_append.webm",
  "status": "processing",
  "estimatedDuration": 5,
  "message": "Append transcription in progress.",
  "estimatedCredits": 10
}
```

### Error Responses

#### Insufficient Credits
```json
{
  "statusCode": 403,
  "message": "Insufficient credits for transcription. Required: 10, Available: 5 (user credits)"
}
```

#### Memo Not Found
```json
{
  "statusCode": 404,
  "message": "Memo not found or access denied"
}
```

## Accessing Appended Recordings

Once transcription is complete, the additional recordings will be available in the memo's source:

```typescript
// Fetch updated memo
const { data: memo } = await supabase
  .from('memos')
  .select('*')
  .eq('id', memoId)
  .single();

// Access additional recordings
const additionalRecordings = memo.source.additional_recordings || [];

additionalRecordings.forEach((recording, index) => {
  console.log(`Recording ${index + 1}:`);
  console.log(`- Transcript: ${recording.transcript}`);
  console.log(`- Language: ${recording.primary_language}`);
  console.log(`- Speakers: ${Object.keys(recording.speakers || {}).length}`);
  console.log(`- Status: ${recording.status}`);
});
```

## Real-time Updates

You can subscribe to memo updates to know when the transcription is complete:

```typescript
const subscription = supabase
  .channel(`memo-${memoId}`)
  .on('postgres_changes', 
    { 
      event: 'UPDATE', 
      schema: 'public', 
      table: 'memos',
      filter: `id=eq.${memoId}`
    }, 
    (payload) => {
      const updatedMemo = payload.new;
      // Check if the last additional recording is now completed
      const recordings = updatedMemo.source?.additional_recordings || [];
      const lastRecording = recordings[recordings.length - 1];
      
      if (lastRecording?.status === 'completed') {
        console.log('Transcription completed!', lastRecording);
        // Update UI with new transcription
      }
    }
  )
  .subscribe();
```

## Notes

1. **Credit Requirements**: Append transcription consumes credits the same way as main transcription (2 mana per minute, minimum 10 mana)
2. **Access Control**: Users can only append to memos they own or have access to through spaces
3. **Smart Routing**: Short recordings (<115 min) use fast transcription, longer ones use batch processing
4. **Recording Index**: You can optionally specify a `recordingIndex` to update a specific recording instead of appending a new one
5. **Error Handling**: The service includes comprehensive error handling and fallback strategies matching the main transcription flow