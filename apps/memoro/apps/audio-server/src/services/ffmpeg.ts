import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const FORMAT_MAP: Record<string, string> = {
  '.m4a': 'mp4',
  '.mp4': 'mp4',
  '.mp3': 'mp3',
  '.wav': 'wav',
  '.aac': 'aac',
  '.ogg': 'ogg',
  '.webm': 'webm',
  '.flac': 'flac',
  '.caf': 'caf',
  '.wma': 'asf',
  '.amr': 'amr',
};

const PROBE_FORMAT_MAP: Record<string, string> = {
  mp3: 'mp3',
  mov: 'mp4',
  mp4: 'mp4',
  m4a: 'mp4',
  wav: 'wav',
  aac: 'aac',
  ogg: 'ogg',
  webm: 'webm',
  flac: 'flac',
  caf: 'caf',
  asf: 'asf',
  amr: 'amr',
};

async function probeAudioFile(
  filePath: string,
): Promise<{ valid: boolean; format?: string; codec?: string; duration?: number }> {
  return new Promise((resolve) => {
    (ffmpeg as any).ffprobe(filePath, (err: Error | null, metadata: any) => {
      if (err) {
        console.warn(`[ffmpeg] Probe failed for ${filePath}: ${err.message}`);
        resolve({ valid: false });
        return;
      }

      const format = metadata?.format?.format_name;
      const duration = metadata?.format?.duration;
      const audioStream = metadata?.streams?.find((s: any) => s.codec_type === 'audio');
      const codec = audioStream?.codec_name;

      resolve({ valid: true, format, codec, duration });
    });
  });
}

async function cleanup(...files: string[]): Promise<void> {
  await Promise.all(
    files.map((f) =>
      fs.promises.unlink(f).catch(() => {
        // Ignore cleanup errors
      }),
    ),
  );
}

export async function convertToAzureWav(inputBuffer: Buffer, fileExtension: string): Promise<Buffer> {
  const tempDir = os.tmpdir();
  const ext = fileExtension.startsWith('.') ? fileExtension : `.${fileExtension}`;
  const inputFile = path.join(tempDir, `memoro_input_${Date.now()}${ext}`);
  const outputFile = path.join(tempDir, `memoro_output_${Date.now()}.wav`);

  console.log(`[ffmpeg] Converting audio (${ext}) to Azure WAV format`);

  try {
    await fs.promises.writeFile(inputFile, inputBuffer);

    // Probe actual format to detect mismatches between extension and content
    const probeResult = await probeAudioFile(inputFile);
    let inputFormat = FORMAT_MAP[ext.toLowerCase()];

    if (probeResult.valid && probeResult.format) {
      const probedFormatName = probeResult.format.split(',')[0].trim();
      const detectedFormat = PROBE_FORMAT_MAP[probedFormatName];
      if (detectedFormat && detectedFormat !== inputFormat) {
        console.warn(
          `[ffmpeg] Format mismatch: extension suggests "${inputFormat}", content detected as "${detectedFormat}". Using detected format.`,
        );
        inputFormat = detectedFormat;
      }
      console.log(`[ffmpeg] Probed format: ${probeResult.format}, codec: ${probeResult.codec}`);
    }

    return await new Promise<Buffer>((resolve, reject) => {
      const command = (ffmpeg as any)(inputFile)
        .audioCodec('pcm_s16le') // PCM 16-bit little-endian
        .audioFrequency(16000) // 16kHz — Azure's preferred sample rate
        .audioChannels(1) // Mono
        .format('wav')
        .inputOptions([
          '-err_detect',
          'ignore_err', // Handle iOS spatial audio metadata (chnl box) gracefully
          '-fflags',
          '+genpts', // Generate presentation timestamps
        ])
        .outputOptions(['-y']);

      if (inputFormat) {
        command.inputFormat(inputFormat);
        console.log(`[ffmpeg] Using input format: ${inputFormat} for extension: ${ext}`);
      } else {
        console.warn(`[ffmpeg] Unknown format for extension ${ext}, letting ffmpeg auto-detect`);
      }

      command
        .on('end', async () => {
          try {
            const converted = await fs.promises.readFile(outputFile);
            await cleanup(inputFile, outputFile);
            console.log(`[ffmpeg] Conversion complete: ${converted.length} bytes`);
            resolve(converted);
          } catch (readErr) {
            await cleanup(inputFile, outputFile);
            reject(readErr);
          }
        })
        .on('error', async (err: Error) => {
          await cleanup(inputFile, outputFile);
          console.error(`[ffmpeg] Conversion error for ${ext}: ${err.message}`);
          reject(err);
        })
        .save(outputFile);
    });
  } catch (err) {
    await cleanup(inputFile, outputFile);
    throw err;
  }
}

export async function getAudioDuration(buffer: Buffer): Promise<number> {
  const tempDir = os.tmpdir();
  const tempFile = path.join(tempDir, `memoro_probe_${Date.now()}.tmp`);

  try {
    await fs.promises.writeFile(tempFile, buffer);

    return await new Promise<number>((resolve, reject) => {
      (ffmpeg as any).ffprobe(tempFile, async (err: Error | null, metadata: any) => {
        await cleanup(tempFile);

        if (err) {
          reject(new Error(`Failed to probe audio duration: ${err.message}`));
          return;
        }

        const duration = metadata?.format?.duration;
        if (typeof duration === 'number') {
          resolve(duration);
        } else {
          reject(new Error('Could not determine audio duration from metadata'));
        }
      });
    });
  } catch (err) {
    await cleanup(tempFile);
    throw err;
  }
}
