// Oben bei Ihren Imports:
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { serve } from 'https://deno.land/std@0.215.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
	StorageSharedKeyCredential,
	generateBlobSASQueryParameters,
	BlobSASPermissions,
	SASProtocol,
} from 'npm:@azure/storage-blob@12'; // Aktuelle stabile Version prüfen, z.B. @12.17.0
// --- WICHTIG: Verwenden Sie den Service Role Key! ---
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const C_SUPABASE_SECRET_KEY = Deno.env.get('C_SUPABASE_SECRET_KEY'); // KORRIGIERT!
if (!SUPABASE_URL || !C_SUPABASE_SECRET_KEY) {
	console.error('Supabase URL or Service Role Key not set in environment variables!');
	// Im Fehlerfall früh aussteigen oder anders behandeln
	Deno.exit(1); // Oder eine Response mit Fehlerstatus senden
}
const supabase = createClient(SUPABASE_URL, C_SUPABASE_SECRET_KEY);
const AZURE_STORAGE_ACCOUNT_NAME = Deno.env.get('BATCH_API_AZURE_STORAGE_ACCOUNT_NAME');
const AZURE_STORAGE_ACCOUNT_KEY = Deno.env.get('BATCH_API_AZURE_STORAGE_ACCOUNT_KEY');
if (!AZURE_STORAGE_ACCOUNT_NAME || !AZURE_STORAGE_ACCOUNT_KEY) {
	console.error('Azure Storage Account Name or Key not set in environment variables!');
	// Im Fehlerfall früh aussteigen oder anders behandeln
}
// Globale Instanz, da Keys sich nicht ändern
const sharedKeyCredential =
	AZURE_STORAGE_ACCOUNT_NAME && AZURE_STORAGE_ACCOUNT_KEY
		? new StorageSharedKeyCredential(AZURE_STORAGE_ACCOUNT_NAME, AZURE_STORAGE_ACCOUNT_KEY)
		: null;
// Helper function to ensure we're working with objects
function ensureObject(value) {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return {};
	}
	return value;
}
serve(async (req) => {
	const rawBody = await req.text(); // Body einmal lesen
	console.log('--- Incoming Request ---');
	console.log('Headers:', JSON.stringify(Object.fromEntries(req.headers), null, 2));
	console.log('Raw Body:', rawBody.substring(0, 500) + (rawBody.length > 500 ? '...' : '')); // Nur Anfang loggen
	const corsHeaders = {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, aeg-event-type',
	};
	if (req.method === 'OPTIONS') {
		return new Response(null, {
			headers: corsHeaders,
			status: 204,
		});
	}
	if (req.method !== 'POST') {
		return new Response('Nur POST erlaubt', {
			headers: corsHeaders,
			status: 405,
		});
	}
	let events;
	try {
		events = JSON.parse(rawBody);
	} catch (e) {
		console.error('Fehler beim Parsen des JSON-Bodys:', e, rawBody);
		return new Response('Ungültiges JSON', {
			headers: corsHeaders,
			status: 400,
		});
	}
	if (!Array.isArray(events)) {
		console.error('Body ist kein Array:', events);
		return new Response('Erwarte Event-Array', {
			headers: corsHeaders,
			status: 400,
		});
	}
	const subValidation = events.find(
		(e) => e.eventType === 'Microsoft.EventGrid.SubscriptionValidationEvent'
	);
	if (subValidation) {
		const validationCode = subValidation.data.validationCode;
		console.log(`Event Grid Handshake - Code: ${validationCode}`);
		return new Response(
			JSON.stringify({
				validationResponse: validationCode,
			}),
			{
				headers: {
					...corsHeaders,
					'Content-Type': 'application/json',
				},
				status: 200,
			}
		);
	}
	for (const ev of events) {
		if (ev.eventType !== 'Microsoft.Storage.BlobCreated') {
			console.log(`Überspringe Event-Typ: ${ev.eventType}`);
			continue;
		}
		const blobUrlFromEvent = ev.data?.url; // Dies ist die URL OHNE SAS
		if (!blobUrlFromEvent) {
			console.error('Event ohne data.url:', ev);
			continue;
		}
		try {
			if (!sharedKeyCredential) {
				throw new Error('Azure Storage Credentials nicht initialisiert in der Funktion.');
			}
			const urlObject = new URL(blobUrlFromEvent);
			const pathParts = urlObject.pathname.split('/'); // z.B. ['', 'results', 'jobIdFolder', 'blobName.json']
			if (pathParts.length < 4) {
				console.log('Pfad zu kurz, überspringe:', blobUrlFromEvent);
				continue;
			}
			const containerName = decodeURIComponent(pathParts[1]); // z.B. 'results'
			const jobIdAsFolderName = decodeURIComponent(pathParts[2]); // z.B. 'd43e7090-0871...'
			const blobNameFromFile = decodeURIComponent(pathParts[3]); // z.B. 'contenturl_0.json'
			console.log(
				`Verarbeite Blob: ${blobNameFromFile} in Container ${containerName} für Job: ${jobIdAsFolderName}`
			);
			if (blobNameFromFile.endsWith('_report.json') || !blobNameFromFile.endsWith('.json')) {
				console.log(`Überspringe Datei (Report oder nicht-JSON): ${blobNameFromFile}`);
				continue;
			}
			// --- SAS-TOKEN-GENERIERUNG START ---
			const blobSas = generateBlobSASQueryParameters(
				{
					containerName: containerName,
					blobName: `${jobIdAsFolderName}/${blobNameFromFile}`,
					permissions: BlobSASPermissions.parse('r'),
					startsOn: new Date(new Date().valueOf() - 5 * 60 * 1000),
					expiresOn: new Date(new Date().valueOf() + 10 * 60 * 1000),
					protocol: SASProtocol.Https,
				},
				sharedKeyCredential
			).toString();
			const urlWithSas = `${blobUrlFromEvent}?${blobSas}`;
			console.log(`Lade JSON mit SAS: ${blobUrlFromEvent}?sv=... (SAS-Token gekürzt)`);
			// --- SAS-TOKEN-GENERIERUNG ENDE ---
			const response = await fetch(urlWithSas);
			if (!response.ok) {
				const errorText = await response.text(); // Fehlertext von Azure Storage lesen
				throw new Error(
					`Fetch fehlgeschlagen ${response.status} (${response.statusText}) für ${blobUrlFromEvent}. Azure-Fehler: ${errorText}`
				);
			}
			const json = await response.json();
			console.log(`JSON für ${jobIdAsFolderName} erfolgreich geladen.`);
			// Try different query approaches to find the memo with this jobId
			let memo = null;
			let fetchErr = null;
			// Use proper JSONB operators to find the memo with this jobId
			const { data, error } = await supabase
				.from('memos')
				.select('id, source, metadata, title, style')
				.eq('metadata->processing->transcription->>jobId', jobIdAsFolderName)
				.limit(1)
				.maybeSingle();
			if (!error && data) {
				memo = data;
			} else {
				fetchErr = error;
			}
			if (fetchErr || !memo) {
				console.error(
					`Memo nicht gefunden für Job: ${jobIdAsFolderName}`,
					fetchErr || 'Kein Memo zurückgegeben'
				);
				continue;
			}
			console.log(`Memo ${memo.id} für Job ${jobIdAsFolderName} gefunden.`);
			// Safely handle existing data that might be null or undefined
			const existingSource = ensureObject(memo.source);
			const existingMeta = ensureObject(memo.metadata);
			const existingProc = ensureObject(existingMeta.processing);
			const existingTranscription = ensureObject(existingProc.transcription);
			const existingStyle = ensureObject(memo.style);
			const baseInfo = {
				...existingTranscription,
				jobId: jobIdAsFolderName,
				batchTranscription: true,
			};
			let updateData = {};
			const isResultJson = json.recognizedPhrases || json.combinedRecognizedPhrases;
			const hasErrorInJson = json.status === 'Failed' || json.error; // Azure-Fehlerstatus im JSON
			if (hasErrorInJson || !isResultJson) {
				const errorDetail =
					json.error ??
					json.statusMessage ??
					'Kein Transkript in JSON gefunden oder expliziter Fehlerstatus';
				// For error case, update fields (metadata will be set via RPC after update)
				updateData = {
					// Set title if not already set
					title: memo.title || 'Transkription fehlgeschlagen',
					// Ensure updated_at is set
					updated_at: new Date().toISOString(),
					// Store error details to use after update
					_errorDetails: {
						transcription: {
							...baseInfo,
							status: 'error',
							error: errorDetail,
							retryable: true,
						},
						headline: {
							headline: 'Transkription fehlgeschlagen',
							intro: `Die Transkription konnte nicht verarbeitet werden: ${errorDetail}`,
							language: 'de-DE',
						},
					},
				};
				console.warn(
					'Batch-Transkription FEHLER (JSON-Inhalt) für Job',
					jobIdAsFolderName,
					errorDetail
				);
			} else {
				// Extract text from nBest array
				const text =
					json.combinedRecognizedPhrases
						?.map((p) => p.nBest?.[0]?.display || p.display || p.text || '')
						.join(' ') ||
					json.recognizedPhrases
						?.map((p) => p.nBest?.[0]?.display || p.display || p.text || '')
						.join(' ') ||
					'';
				if (!text) {
					console.warn(
						`Kein Text extrahiert aus JSON für Job ${jobIdAsFolderName}. JSON-Struktur:`,
						JSON.stringify(json, null, 2).substring(0, 500)
					);
					// Handle empty transcript case (metadata will be set via RPC after update)
					updateData = {
						title: memo.title || 'Aufnahme ohne Sprache',
						transcript: '',
						style: {
							intro: 'Diese Aufnahme enthält keinen erkennbaren gesprochenen Text.',
						},
						updated_at: new Date().toISOString(),
						// Store details to use after update
						_emptyTranscriptDetails: {
							transcription: {
								...baseInfo,
								status: 'completed_no_transcript',
								error: null,
								textLength: 0,
							},
							headline: {
								headline: 'Aufnahme ohne Sprache',
								intro: 'Diese Aufnahme enthält keinen erkennbaren gesprochenen Text.',
								language: 'de-DE',
								triggered_by: 'empty_transcript_handler',
							},
						},
					};
				} else {
					console.log(`Extrahierter Text für ${jobIdAsFolderName}: ${text.substring(0, 100)}...`);
					// Enhanced speaker processing (following transcribe function pattern)
					let enhancedSourceData;
					try {
						// Extract language information
						let primaryAudioLanguage = null;
						let allDetectedPhraseLanguages = ['de-DE']; // fallback
						const languageProcessingLog = [];
						// Check if user selected languages are available in metadata
						const userSelectedLanguages =
							existingMeta?.processing?.transcription?.userSelectedLanguages;
						const hasUserSelectedLanguages =
							userSelectedLanguages &&
							Array.isArray(userSelectedLanguages) &&
							userSelectedLanguages.length > 0;
						if (hasUserSelectedLanguages) {
							// Use user-selected languages if available
							primaryAudioLanguage = userSelectedLanguages[0];
							allDetectedPhraseLanguages = userSelectedLanguages;
							languageProcessingLog.push(
								`Verwende vom Benutzer ausgewählte Sprachen: ${userSelectedLanguages.join(', ')}`
							);
						} else if (json.locale && typeof json.locale === 'string') {
							primaryAudioLanguage = json.locale;
							allDetectedPhraseLanguages = [json.locale];
							languageProcessingLog.push(
								`Sprache aus dem Top-Level 'locale'-Feld extrahiert: ${primaryAudioLanguage} (Azure erkannt)`
							);
						} else if (
							json.recognizedPhrases &&
							Array.isArray(json.recognizedPhrases) &&
							json.recognizedPhrases.length > 0
						) {
							const languageCounts = {};
							for (const phrase of json.recognizedPhrases) {
								if (phrase.locale && typeof phrase.locale === 'string') {
									languageCounts[phrase.locale] = (languageCounts[phrase.locale] || 0) + 1;
								}
							}
							const uniqueLanguagesFromPhrases = Object.keys(languageCounts);
							if (uniqueLanguagesFromPhrases.length > 0) {
								let mostFrequent = uniqueLanguagesFromPhrases[0] || 'de-DE';
								let maxCount = languageCounts[mostFrequent] || 0;
								for (const locale of uniqueLanguagesFromPhrases) {
									if (languageCounts[locale] > maxCount) {
										mostFrequent = locale;
										maxCount = languageCounts[locale];
									}
								}
								primaryAudioLanguage = mostFrequent;
								allDetectedPhraseLanguages = uniqueLanguagesFromPhrases;
								languageProcessingLog.push(
									`Häufigste Sprache (primär) aus Phrase-Segmenten ermittelt: ${primaryAudioLanguage} (Anzahl: ${maxCount} von ${json.recognizedPhrases.length} Phrasen)`
								);
								languageProcessingLog.push(
									`Alle in Phrasen erkannten Sprachen: ${allDetectedPhraseLanguages.join(', ')}`
								);
							}
						}
						if (primaryAudioLanguage === null) {
							primaryAudioLanguage = 'de-DE';
							languageProcessingLog.push(
								`Keine Sprache erkannt. Verwende Fallback-Sprache: ${primaryAudioLanguage}`
							);
						}
						languageProcessingLog.forEach((msg) =>
							console[msg.startsWith('WARN:') ? 'warn' : 'log'](msg)
						);
						// Process speaker data
						const utterances = [];
						const speakers = {};
						const segments = json.recognizedPhrases || [];
						console.log(`Processing ${segments.length} segments for speaker data`);
						segments.forEach((segment) => {
							// Check if speaker field exists (including speaker 0) and get display text from nBest
							const displayText = segment.nBest?.[0]?.display;
							if ('speaker' in segment && displayText) {
								const speakerId = `speaker${segment.speaker}`;
								utterances.push({
									speakerId,
									text: displayText,
									offset: segment.offsetInTicks
										? Math.round(segment.offsetInTicks / 10000)
										: undefined,
									duration: segment.durationInTicks
										? Math.round(segment.durationInTicks / 10000)
										: undefined,
								});
								// Add speaker to speakers object immediately
								if (!speakers[speakerId]) {
									speakers[speakerId] = `Speaker ${segment.speaker}`;
								}
							}
						});
						// Sort utterances by time
						utterances.sort((a, b) => (a.offset || 0) - (b.offset || 0));
						const speakerCount = Object.keys(speakers).length;
						console.log(
							`Enhanced batch transcription completed. Text: ${text.length} chars, Language: ${primaryAudioLanguage}, Speakers: ${speakerCount}`
						);
						console.log(`Found ${utterances.length} utterances from ${speakerCount} speakers`);
						// Build enhanced source data without transcript (moved to separate column)
						enhancedSourceData = {
							primary_language: primaryAudioLanguage,
							languages: allDetectedPhraseLanguages,
							utterances: utterances.length > 0 ? utterances : null,
							speakers: Object.keys(speakers).length > 0 ? speakers : null,
						};
					} catch (speakerError) {
						console.warn('Speaker data extraction failed, saving text only:', speakerError);
						// Fallback to just language data
						enhancedSourceData = {
							primary_language: 'de-DE',
							languages: ['de-DE'],
						};
					}
					// Build the complete updated source object safely
					const updatedSource = {
						...existingSource,
						...enhancedSourceData, // Add the transcription-specific fields
					};
					updateData = {
						source: updatedSource,
						transcript: text,
						updated_at: new Date().toISOString(),
						// Store details to use after update
						_successDetails: {
							transcription: {
								...baseInfo,
								status: 'completed',
								error: null,
								textLength: text.length,
								speakerCount: Object.keys(updatedSource.speakers || {}).length,
							},
						},
					};
				}
			}
			// Extract details for RPC calls before removing them from updateData
			const errorDetails = updateData._errorDetails;
			const emptyTranscriptDetails = updateData._emptyTranscriptDetails;
			const successDetails = updateData._successDetails;

			// Remove temporary fields from updateData before actual update
			delete updateData._errorDetails;
			delete updateData._emptyTranscriptDetails;
			delete updateData._successDetails;

			const { error: updErr } = await supabase.from('memos').update(updateData).eq('id', memo.id);
			if (updErr) {
				console.error(`Fehler beim Updaten von Memo ${memo.id}:`, updErr);
				console.error('Update data was:', JSON.stringify(updateData, null, 2));
			} else {
				console.log(`Memo ${memo.id} erfolgreich aktualisiert für Job ${jobIdAsFolderName}.`);
				console.log('Update included fields:', Object.keys(updateData));

				// Now update processing statuses atomically via RPC
				const timestamp = new Date().toISOString();

				if (errorDetails) {
					// Error case: Update transcription and headline_and_intro
					await supabase.rpc('set_memo_process_error', {
						p_memo_id: memo.id,
						p_process_name: 'transcription',
						p_timestamp: timestamp,
						p_reason: errorDetails.transcription.error,
						p_details: {
							jobId: errorDetails.transcription.jobId,
							batchTranscription: errorDetails.transcription.batchTranscription,
							retryable: errorDetails.transcription.retryable,
						},
					});

					await supabase.rpc('set_memo_process_error', {
						p_memo_id: memo.id,
						p_process_name: 'headline_and_intro',
						p_timestamp: timestamp,
						p_reason: 'Transcription failed',
						p_details: errorDetails.headline,
					});
				} else if (emptyTranscriptDetails) {
					// Empty transcript case: Update transcription and headline_and_intro
					await supabase.rpc('set_memo_process_status_with_details', {
						p_memo_id: memo.id,
						p_process_name: 'transcription',
						p_status: 'completed_no_transcript',
						p_timestamp: timestamp,
						p_details: {
							jobId: emptyTranscriptDetails.transcription.jobId,
							batchTranscription: emptyTranscriptDetails.transcription.batchTranscription,
							error: null,
							textLength: 0,
						},
					});

					await supabase.rpc('set_memo_process_status_with_details', {
						p_memo_id: memo.id,
						p_process_name: 'headline_and_intro',
						p_status: 'completed_no_transcript',
						p_timestamp: timestamp,
						p_details: emptyTranscriptDetails.headline,
					});
				} else if (successDetails) {
					// Success case: Update only transcription
					await supabase.rpc('set_memo_process_status_with_details', {
						p_memo_id: memo.id,
						p_process_name: 'transcription',
						p_status: 'completed',
						p_timestamp: timestamp,
						p_details: {
							jobId: successDetails.transcription.jobId,
							batchTranscription: successDetails.transcription.batchTranscription,
							error: null,
							textLength: successDetails.transcription.textLength,
							speakerCount: successDetails.transcription.speakerCount,
						},
					});
				}
				// Send broadcast update to notify clients about the transcription update
				try {
					const channel = supabase.channel(`memo-updates-${memo.id}`);
					// Subscribe first to ensure the channel is ready
					channel.subscribe(async (status) => {
						if (status === 'SUBSCRIBED') {
							await channel.send({
								type: 'broadcast',
								event: 'memo-updated',
								payload: {
									type: 'memo-updated',
									memoId: memo.id,
									changes: {
										source: updateData.source,
										transcript: updateData.transcript,
										title: updateData.title,
										style: updateData.style,
										updated_at: updateData.updated_at,
									},
									source: 'batch-transcribe-callback',
								},
							});
							console.log(`Broadcast sent for memo ${memo.id} transcription update`);
							// Clean up the channel after sending
							supabase.removeChannel(channel);
						}
					});
				} catch (broadcastError) {
					console.warn('Failed to send broadcast update:', broadcastError);
					// Don't fail the function if broadcast fails
				}
			}
		} catch (err) {
			console.error(
				`Genereller Fehler bei Event-Verarbeitung für URL ${blobUrlFromEvent}:`,
				err.message,
				err.stack
			);
		}
	}
	return new Response('Events verarbeitet', {
		headers: corsHeaders,
		status: 200,
	});
});
