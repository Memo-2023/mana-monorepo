import { Hono } from 'hono';
import { downloadAudioFromStorage } from '../lib/supabase.ts';
import { TranscriptionService } from '../services/transcription.ts';

interface TranscribeBody {
  audioPath: string;
  memoId: string;
  userId: string;
  spaceId?: string;
  recordingLanguages?: string[];
  enableDiarization?: boolean;
  isAppend?: boolean;
  recordingIndex?: number;
}

const transcriptionService = new TranscriptionService();

export function createTranscribeRoutes() {
  const app = new Hono();

  app.post('/', async (c) => {
    let body: TranscribeBody;

    try {
      body = await c.req.json<TranscribeBody>();
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400);
    }

    const { audioPath, memoId, userId, spaceId, recordingLanguages, enableDiarization, recordingIndex } = body;

    if (!audioPath || !memoId || !userId) {
      return c.json({ error: 'Missing required fields: audioPath, memoId, userId' }, 400);
    }

    const serviceKey = process.env.SERVICE_KEY ?? '';
    const serverUrl = process.env.MEMORO_SERVER_URL ?? 'http://localhost:3015';

    console.log(`[Route] POST /transcribe — memoId: ${memoId}, userId: ${userId}, audioPath: ${audioPath}`);

    // Fire-and-forget: return immediately, process in background
    queueMicrotask(async () => {
      try {
        const audioBuffer = await downloadAudioFromStorage(audioPath);
        await transcriptionService.transcribeWithFallback({
          audioBuffer,
          audioPath,
          memoId,
          userId,
          spaceId,
          recordingLanguages,
          enableDiarization,
          isAppend: false,
          recordingIndex,
          serviceKey,
          serverUrl,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[Route] Transcription background task failed for memo ${memoId}: ${msg}`);
      }
    });

    return c.json({
      success: true,
      memoId,
      message: 'Transcription started',
    });
  });

  app.post('/append', async (c) => {
    let body: TranscribeBody;

    try {
      body = await c.req.json<TranscribeBody>();
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400);
    }

    const { audioPath, memoId, userId, spaceId, recordingLanguages, enableDiarization, recordingIndex } = body;

    if (!audioPath || !memoId || !userId) {
      return c.json({ error: 'Missing required fields: audioPath, memoId, userId' }, 400);
    }

    const serviceKey = process.env.SERVICE_KEY ?? '';
    const serverUrl = process.env.MEMORO_SERVER_URL ?? 'http://localhost:3015';

    console.log(
      `[Route] POST /transcribe/append — memoId: ${memoId}, userId: ${userId}, audioPath: ${audioPath}, recordingIndex: ${recordingIndex}`,
    );

    // Fire-and-forget: return immediately, process in background
    queueMicrotask(async () => {
      try {
        const audioBuffer = await downloadAudioFromStorage(audioPath);
        await transcriptionService.transcribeWithFallback({
          audioBuffer,
          audioPath,
          memoId,
          userId,
          spaceId,
          recordingLanguages,
          enableDiarization,
          isAppend: true,
          recordingIndex,
          serviceKey,
          serverUrl,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[Route] Append transcription background task failed for memo ${memoId}: ${msg}`);
      }
    });

    return c.json({
      success: true,
      memoId,
      message: 'Append transcription started',
    });
  });

  return app;
}
