import { BATCH_ENDPOINT_BASE, type SpeechServiceConfig } from '../lib/azure.ts';
import { convertToAzureWav } from './ffmpeg.ts';

const DEFAULT_CANDIDATE_LOCALES = [
  'en-US',
  'de-DE',
  'en-GB',
  'fr-FR',
  'it-IT',
  'es-ES',
  'sv-SE',
  'ru-RU',
  'nl-NL',
  'tr-TR',
  'pt-PT',
];

interface BatchJobResult {
  jobId: string;
  status: 'processing';
}

interface BatchJobStatus {
  jobId: string;
  status: string;
  self?: string;
  files?: string;
}

async function getAzureBlobClients(accountName: string, accountKey: string) {
  const { BlobServiceClient, StorageSharedKeyCredential } = await import('@azure/storage-blob');
  const credential = new StorageSharedKeyCredential(accountName, accountKey);
  const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    credential,
  );
  return { blobServiceClient, credential };
}

async function uploadWavToBlob(
  wavBuffer: Buffer,
  userId: string,
  accountName: string,
  accountKey: string,
): Promise<string> {
  const { BlobSASPermissions, generateBlobSASQueryParameters } = await import('@azure/storage-blob');
  const { blobServiceClient, credential } = await getAzureBlobClients(accountName, accountKey);

  const containerName = 'batch-transcription';
  const blobName = `transcriptions/${userId}/${Date.now()}.wav`;

  const containerClient = blobServiceClient.getContainerClient(containerName);
  await containerClient.createIfNotExists();

  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.upload(wavBuffer, wavBuffer.length, {
    blobHTTPHeaders: { blobContentType: 'audio/wav' },
  });

  console.log(`[Batch] Uploaded WAV to Azure Blob: ${containerName}/${blobName}`);

  const sasOptions = {
    containerName,
    blobName,
    permissions: BlobSASPermissions.parse('r'),
    startsOn: new Date(Date.now() - 5 * 60 * 1000),
    expiresOn: new Date(Date.now() + 6 * 60 * 60 * 1000),
  };

  const sasToken = generateBlobSASQueryParameters(sasOptions, credential).toString();
  return `${blockBlobClient.url}?${sasToken}`;
}

async function ensureResultsContainerSasUrl(accountName: string, accountKey: string): Promise<string> {
  const { ContainerSASPermissions, generateBlobSASQueryParameters } = await import('@azure/storage-blob');
  const { blobServiceClient, credential } = await getAzureBlobClients(accountName, accountKey);

  const resultsContainerName = 'results';
  const containerClient = blobServiceClient.getContainerClient(resultsContainerName);
  await containerClient.createIfNotExists();

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName: resultsContainerName,
      permissions: ContainerSASPermissions.parse('rcw'),
      startsOn: new Date(Date.now() - 5 * 60 * 1000),
      expiresOn: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    credential,
  ).toString();

  return `https://${accountName}.blob.core.windows.net/${resultsContainerName}?${sasToken}`;
}

export class BatchTranscriptionService {
  async createBatchJob(
    audioBuffer: Buffer,
    userId: string,
    speechService: SpeechServiceConfig,
    languages?: string[],
    diarization?: boolean,
  ): Promise<BatchJobResult> {
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

    if (!accountName || !accountKey) {
      throw new Error('Azure Storage credentials not configured (AZURE_STORAGE_ACCOUNT_NAME, AZURE_STORAGE_ACCOUNT_KEY)');
    }

    console.log(`[Batch] Creating batch transcription job for user ${userId}`);

    // Convert audio to WAV before uploading
    const wavBuffer = await convertToAzureWav(audioBuffer, '.wav');

    // Upload WAV to Azure Blob Storage
    const sasUrl = await uploadWavToBlob(wavBuffer, userId, accountName, accountKey);
    console.log(`[Batch] Got SAS URL for blob`);

    // Ensure results container and get its SAS URL
    const destinationUrl = await ensureResultsContainerSasUrl(accountName, accountKey);

    // Build candidate locales
    const mainLocale = languages?.[0] || 'de-DE';
    let candidateLocales =
      languages && languages.length > 0
        ? Array.from(new Set([mainLocale, ...languages, ...DEFAULT_CANDIDATE_LOCALES]))
        : DEFAULT_CANDIDATE_LOCALES;

    candidateLocales = candidateLocales.slice(0, 10);
    if (candidateLocales.length < 2) {
      candidateLocales = Array.from(new Set([...candidateLocales, 'en-US', 'de-DE'])).slice(0, 10);
    }

    const properties: Record<string, unknown> = {
      wordLevelTimestampsEnabled: true,
      punctuationMode: 'DictatedAndAutomatic',
      profanityFilterMode: 'Masked',
      destinationContainerUrl: destinationUrl,
      timeToLive: 'PT12H',
      languageIdentification: {
        candidateLocales,
        mode: 'Continuous',
      },
    };

    if (diarization !== false) {
      properties['diarizationEnabled'] = true;
      properties['speakerCount'] = 10;
    }

    const transcriptionBody = {
      contentUrls: [sasUrl],
      locale: mainLocale,
      displayName: userId,
      properties,
    };

    const batchEndpoint = `${BATCH_ENDPOINT_BASE}/v3.1/transcriptions`;
    console.log(`[Batch] Submitting job to: ${batchEndpoint}`);

    const response = await fetch(batchEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': speechService.key,
      },
      body: JSON.stringify(transcriptionBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Batch] Job creation failed: ${response.status} - ${errorText}`);
      throw new Error(`Azure Batch API error: ${response.status} - ${errorText}`);
    }

    const jobData = await response.json() as { self?: string };
    const jobId = jobData.self?.split('/').pop() ?? String(Date.now());

    console.log(`[Batch] Job created successfully: ${jobId}`);

    return { jobId, status: 'processing' };
  }

  async getJobStatus(jobId: string, speechService: SpeechServiceConfig): Promise<BatchJobStatus> {
    const batchEndpoint = `${BATCH_ENDPOINT_BASE}/v3.1/transcriptions/${jobId}`;

    console.log(`[Batch] Checking job status: ${jobId}`);

    const response = await fetch(batchEndpoint, {
      method: 'GET',
      headers: {
        'Ocp-Apim-Subscription-Key': speechService.key,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Azure Batch status check failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as { status?: string; self?: string; links?: { files?: string } };

    return {
      jobId,
      status: data.status ?? 'unknown',
      self: data.self,
      files: data.links?.files,
    };
  }
}
