import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AudioRequest {
	textId: string;
	content: string;
	voice: string;
	provider: 'google' | 'elevenlabs' | 'openai';
	speed: number;
	chunkSize?: number;
	versionId?: string;
}

interface AudioChunk {
	id: string;
	start: number;
	end: number;
	content: string;
}

serve(async (req) => {
	// Handle CORS preflight requests
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		// Parse request first to get provider
		const requestData: AudioRequest = await req.json();
		const { provider = 'google' } = requestData;

		// Check required environment variables based on provider
		let apiKeyPresent = false;
		let missingKeyMessage = '';

		switch (provider) {
			case 'google':
				apiKeyPresent = !!Deno.env.get('GOOGLE_TTS_API_KEY');
				missingKeyMessage = 'Missing GOOGLE_TTS_API_KEY environment variable';
				break;
			case 'elevenlabs':
				apiKeyPresent = !!Deno.env.get('ELEVENLABS_API_KEY');
				missingKeyMessage = 'Missing ELEVENLABS_API_KEY environment variable';
				break;
			case 'openai':
				apiKeyPresent = !!Deno.env.get('OPENAI_API_KEY');
				missingKeyMessage = 'Missing OPENAI_API_KEY environment variable';
				break;
		}

		if (!apiKeyPresent) {
			console.error(missingKeyMessage);
			return new Response(JSON.stringify({ error: 'TTS service not configured' }), {
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		// Initialize Supabase client
		const supabaseClient = createClient(
			Deno.env.get('SUPABASE_URL') ?? '',
			Deno.env.get('SUPABASE_ANON_KEY') ?? '',
			{
				global: {
					headers: { Authorization: req.headers.get('Authorization')! },
				},
			}
		);

		// Get user from JWT token
		const {
			data: { user },
		} = await supabaseClient.auth.getUser();

		if (!user) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		const { textId, content, voice, speed, chunkSize = 1000, versionId } = requestData;

		// Validate input
		if (!textId || !content) {
			return new Response(JSON.stringify({ error: 'Missing required fields' }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		// Split text into chunks
		const chunks: AudioChunk[] = [];
		for (let i = 0; i < content.length; i += chunkSize) {
			chunks.push({
				id: `chunk-${chunks.length}`,
				start: i,
				end: Math.min(i + chunkSize, content.length),
				content: content.slice(i, Math.min(i + chunkSize, content.length)),
			});
		}

		// Generate audio based on the provider
		let audioResult;

		switch (provider) {
			case 'elevenlabs':
				audioResult = await generateElevenLabsTTS(chunks, voice, speed);
				break;
			case 'openai':
				audioResult = await generateOpenAITTS(chunks, voice, speed);
				break;
			case 'google':
			default:
				audioResult = await generateGoogleTTS(chunks, voice, speed);
				break;
		}

		const { audioChunks, totalSize } = audioResult;

		// Store audio chunks in Supabase Storage
		const storedChunks = [];
		for (const chunkData of audioChunks) {
			try {
				// Use versionId in path if provided, otherwise use default path
				const fileName = versionId
					? `${user.id}/${textId}/${versionId}/${chunkData.id}.mp3`
					: `${user.id}/${textId}/${chunkData.id}.mp3`;

				const { error: uploadError } = await supabaseClient.storage
					.from('audio')
					.upload(fileName, chunkData.audioBuffer, {
						contentType: 'audio/mpeg',
						upsert: true,
					});

				if (uploadError) {
					console.error('Upload error:', uploadError);
					throw uploadError;
				}

				// Create audio chunk metadata for storage
				storedChunks.push({
					id: chunkData.id,
					start: chunkData.start,
					end: chunkData.end,
					filename: fileName,
					size: chunkData.size,
					duration: chunkData.duration,
					createdAt: new Date().toISOString(),
				});
			} catch (error) {
				console.error(`Error storing chunk ${chunkData.id}:`, error);
				// Continue with other chunks, but log the error
			}
		}

		// Update text record with audio metadata
		const { error: updateError } = await supabaseClient
			.from('texts')
			.update({
				data: {
					audio: {
						hasLocalCache: false, // Will be set to true when downloaded to device
						chunks: storedChunks,
						totalSize,
						lastGenerated: new Date().toISOString(),
						settings: { voice, speed, provider },
					},
				},
			})
			.eq('id', textId)
			.eq('user_id', user.id);

		if (updateError) {
			throw updateError;
		}

		return new Response(
			JSON.stringify({
				success: true,
				chunksGenerated: storedChunks.length,
				totalSize,
				chunks: storedChunks,
				provider,
			}),
			{
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			}
		);
	} catch (error) {
		console.error('Error in generate-audio function:', error);
		return new Response(JSON.stringify({ error: error.message }), {
			status: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	}
});

function extractLanguageCode(voiceId: string): string {
	// Extract language code from voice ID (e.g., "de-DE" from "de-DE-Neural2-G")
	const parts = voiceId.split('-');
	if (parts.length >= 2) {
		return `${parts[0]}-${parts[1]}`;
	}
	return 'de-DE'; // Default fallback
}

function getVoiceName(voiceId: string): string {
	// If it's already a full voice ID (contains more than just language code), return it
	if (voiceId.includes('-') && voiceId.split('-').length > 2) {
		return voiceId;
	}

	// Legacy support: map old language codes to default voices
	const legacyVoiceMap: Record<string, string> = {
		'de-DE': 'de-DE-Neural2-A',
		'en-US': 'en-US-Neural2-A',
		'en-GB': 'en-GB-Neural2-A',
	};

	return legacyVoiceMap[voiceId] || 'de-DE-Neural2-A';
}

function estimateAudioDuration(text: string, speed: number): number {
	// Rough estimate: 150 words per minute for normal speech
	const wordsPerMinute = 150 * speed;
	const wordCount = text.split(/\s+/).length;
	return Math.ceil((wordCount / wordsPerMinute) * 60);
}

// Google Cloud TTS Implementation
async function generateGoogleTTS(chunks: AudioChunk[], voice: string, speed: number) {
	const googleApiKey = Deno.env.get('GOOGLE_TTS_API_KEY');
	if (!googleApiKey) {
		throw new Error('Google TTS API key not configured');
	}

	const audioChunks = [];
	let totalSize = 0;

	for (const chunk of chunks) {
		let retries = 0;
		const maxRetries = 3;
		let delay = 1000; // Start with 1 second delay

		while (retries < maxRetries) {
			try {
				const ttsResponse = await fetch(
					`https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleApiKey}`,
					{
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							input: { text: chunk.content },
							voice: {
								languageCode: extractLanguageCode(voice),
								name: getVoiceName(voice),
							},
							audioConfig: {
								audioEncoding: 'MP3',
								speakingRate: speed,
								pitch: 0,
								volumeGainDb: 0,
							},
						}),
					}
				);

				if (ttsResponse.status === 429 || ttsResponse.status === 503) {
					retries++;
					if (retries < maxRetries) {
						console.log(
							`Rate limited on chunk ${chunk.id}, retrying in ${delay}ms (attempt ${retries}/${maxRetries})`
						);
						await new Promise((resolve) => setTimeout(resolve, delay));
						delay *= 2; // Exponential backoff
						continue;
					} else {
						throw new Error(
							`Google TTS error: ${ttsResponse.status} - Rate limit exceeded after ${maxRetries} attempts`
						);
					}
				}

				if (!ttsResponse.ok) {
					const errorBody = await ttsResponse.text();
					console.error('Google TTS API Error:', {
						status: ttsResponse.status,
						body: errorBody,
					});
					throw new Error(`Google TTS error: ${ttsResponse.status}`);
				}

				const ttsData = await ttsResponse.json();
				const audioContent = ttsData.audioContent;
				const audioBuffer = Uint8Array.from(atob(audioContent), (c) => c.charCodeAt(0));
				const audioSize = audioBuffer.length;

				totalSize += audioSize;
				audioChunks.push({
					id: chunk.id,
					start: chunk.start,
					end: chunk.end,
					audioBuffer,
					size: audioSize,
					duration: estimateAudioDuration(chunk.content, speed),
				});
				break; // Success, exit retry loop
			} catch (error) {
				retries++;
				console.error(
					`Error processing Google TTS chunk ${chunk.id} (attempt ${retries}/${maxRetries}):`,
					error
				);
				if (retries >= maxRetries) {
					throw error; // Re-throw after all retries exhausted
				}
				await new Promise((resolve) => setTimeout(resolve, delay));
				delay *= 2; // Exponential backoff for other errors too
			}
		}
	}

	return { audioChunks, totalSize };
}

// ElevenLabs TTS Implementation
async function generateElevenLabsTTS(chunks: AudioChunk[], voice: string, speed: number) {
	const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
	if (!elevenLabsApiKey) {
		throw new Error('ElevenLabs API key not configured');
	}

	const audioChunks = [];
	let totalSize = 0;

	// Map voice IDs to ElevenLabs voice IDs
	const voiceMapping: Record<string, string> = {
		eleven_multilingual_v2: '21m00Tcm4TlvDq8ikWAM', // Rachel
		eleven_multilingual_v1: 'pNInz6obpgDQGcFmaJgB', // Adam
		eleven_turbo_v2: '21m00Tcm4TlvDq8ikWAM', // Rachel Turbo
		eleven_monolingual_v1: '2EiwWnXFnvU5JabPnv8n', // Clyde
	};

	const elevenLabsVoiceId = voiceMapping[voice] || '21m00Tcm4TlvDq8ikWAM';

	for (const chunk of chunks) {
		let retries = 0;
		const maxRetries = 3;
		let delay = 1000; // Start with 1 second delay

		while (retries < maxRetries) {
			try {
				const ttsResponse = await fetch(
					`https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}`,
					{
						method: 'POST',
						headers: {
							'xi-api-key': elevenLabsApiKey,
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							text: chunk.content,
							model_id: voice.includes('turbo') ? 'eleven_turbo_v2' : 'eleven_multilingual_v2',
							voice_settings: {
								stability: 0.5,
								similarity_boost: 0.5,
								style: 0.5,
								use_speaker_boost: true,
							},
						}),
					}
				);

				if (ttsResponse.status === 429 || ttsResponse.status === 503) {
					retries++;
					if (retries < maxRetries) {
						console.log(
							`Rate limited on chunk ${chunk.id}, retrying in ${delay}ms (attempt ${retries}/${maxRetries})`
						);
						await new Promise((resolve) => setTimeout(resolve, delay));
						delay *= 2; // Exponential backoff
						continue;
					} else {
						throw new Error(
							`ElevenLabs TTS error: ${ttsResponse.status} - Rate limit exceeded after ${maxRetries} attempts`
						);
					}
				}

				if (!ttsResponse.ok) {
					throw new Error(`ElevenLabs TTS error: ${ttsResponse.status}`);
				}

				const audioBuffer = new Uint8Array(await ttsResponse.arrayBuffer());
				const audioSize = audioBuffer.length;

				totalSize += audioSize;
				audioChunks.push({
					id: chunk.id,
					start: chunk.start,
					end: chunk.end,
					audioBuffer,
					size: audioSize,
					duration: estimateAudioDuration(chunk.content, speed),
				});
				break; // Success, exit retry loop
			} catch (error) {
				retries++;
				console.error(
					`Error processing ElevenLabs chunk ${chunk.id} (attempt ${retries}/${maxRetries}):`,
					error
				);
				if (retries >= maxRetries) {
					throw error; // Re-throw after all retries exhausted
				}
				await new Promise((resolve) => setTimeout(resolve, delay));
				delay *= 2; // Exponential backoff for other errors too
			}
		}
	}

	return { audioChunks, totalSize };
}

// OpenAI TTS Implementation
async function generateOpenAITTS(chunks: AudioChunk[], voice: string, speed: number) {
	const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
	if (!openaiApiKey) {
		throw new Error('OpenAI API key not configured');
	}

	const audioChunks = [];
	let totalSize = 0;

	for (const chunk of chunks) {
		let retries = 0;
		const maxRetries = 3;
		let delay = 1000; // Start with 1 second delay

		while (retries < maxRetries) {
			try {
				const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${openaiApiKey}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						model: 'tts-1-hd', // Using HD model for better quality
						input: chunk.content,
						voice: voice,
						speed: speed,
					}),
				});

				if (ttsResponse.status === 429) {
					retries++;
					if (retries < maxRetries) {
						console.log(
							`Rate limited on chunk ${chunk.id}, retrying in ${delay}ms (attempt ${retries}/${maxRetries})`
						);
						await new Promise((resolve) => setTimeout(resolve, delay));
						delay *= 2; // Exponential backoff
						continue;
					} else {
						throw new Error(
							`OpenAI TTS error: ${ttsResponse.status} - Rate limit exceeded after ${maxRetries} attempts`
						);
					}
				}

				if (!ttsResponse.ok) {
					throw new Error(`OpenAI TTS error: ${ttsResponse.status}`);
				}

				const audioBuffer = new Uint8Array(await ttsResponse.arrayBuffer());
				const audioSize = audioBuffer.length;

				totalSize += audioSize;
				audioChunks.push({
					id: chunk.id,
					start: chunk.start,
					end: chunk.end,
					audioBuffer,
					size: audioSize,
					duration: estimateAudioDuration(chunk.content, speed),
				});
				break; // Success, exit retry loop
			} catch (error) {
				retries++;
				console.error(
					`Error processing OpenAI chunk ${chunk.id} (attempt ${retries}/${maxRetries}):`,
					error
				);
				if (retries >= maxRetries) {
					throw error; // Re-throw after all retries exhausted
				}
				await new Promise((resolve) => setTimeout(resolve, delay));
				delay *= 2; // Exponential backoff for other errors too
			}
		}
	}

	return { audioChunks, totalSize };
}
