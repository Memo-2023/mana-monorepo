import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { serve } from 'https://deno.land/std@0.215.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const C_SUPABASE_SECRET_KEY = Deno.env.get('C_SUPABASE_SECRET_KEY');
const AZURE_SPEECH_KEY = Deno.env.get('AZURE_SPEECH_KEY');
const AZURE_SPEECH_REGION = Deno.env.get('AZURE_SPEECH_REGION');
const supabase = createClient(SUPABASE_URL, C_SUPABASE_SECRET_KEY);
serve(async (req) => {
	if (req.method !== 'POST') {
		return new Response('Method not allowed', {
			status: 405,
		});
	}
	try {
		const { memoId, jobId } = await req.json();
		console.log(`Checking recovery for memo ${memoId}, job ${jobId}`);
		// 1. Check Azure job status
		const azureStatus = await checkAzureJobStatus(jobId);
		// 2. Handle different scenarios
		if (azureStatus.status === 'Succeeded') {
			// Job completed but webhook never fired - process results
			await processCompletedJob(memoId, jobId, azureStatus);
			return new Response(
				JSON.stringify({
					status: 'recovered',
					action: 'processed_results',
				})
			);
		} else if (azureStatus.status === 'Failed') {
			// Job failed - mark memo as failed
			await markMemoAsFailed(memoId, azureStatus.error);
			return new Response(
				JSON.stringify({
					status: 'recovered',
					action: 'marked_failed',
				})
			);
		} else if (azureStatus.status === 'Running') {
			// Still running - update timeout if needed
			await updateTimeout(memoId);
			return new Response(
				JSON.stringify({
					status: 'still_running',
					action: 'timeout_extended',
				})
			);
		} else {
			// Unknown status - log for investigation
			console.warn(`Unknown Azure status for job ${jobId}:`, azureStatus);
			return new Response(
				JSON.stringify({
					status: 'unknown',
					azureStatus,
				})
			);
		}
	} catch (error) {
		console.error('Recovery function error:', error);
		return new Response(
			JSON.stringify({
				error: error.message,
			}),
			{
				status: 500,
			}
		);
	}
});
async function checkAzureJobStatus(jobId) {
	const response = await fetch(
		`https://${AZURE_SPEECH_REGION}.api.cognitive.microsoft.com/speechtotext/v3.1/transcriptions/${jobId}`,
		{
			headers: {
				'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
			},
		}
	);
	if (!response.ok) {
		throw new Error(`Azure API error: ${response.status}`);
	}
	return await response.json();
}
async function processCompletedJob(memoId, jobId, azureStatus) {
	// Get old memo state for broadcast
	const { data: oldMemo } = await supabase.from('memos').select('*').eq('id', memoId).single();

	// Get transcription files
	const filesResponse = await fetch(azureStatus.links.files, {
		headers: {
			'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
		},
	});
	const filesData = await filesResponse.json();
	// Find transcription result file
	const transcriptionFile = filesData.values.find((file) => file.kind === 'Transcription');
	if (transcriptionFile) {
		// Download and process the result
		const resultResponse = await fetch(transcriptionFile.links.contentUrl);
		const transcriptionResult = await resultResponse.json();
		// Process using same logic as batch-transcribe-callback
		// (Extract text, speakers, languages, etc.)
		// Update memo with results - use atomic RPC to preserve other processing statuses
		const timestamp = new Date().toISOString();
		await supabase.rpc('set_memo_process_status_with_details', {
			p_memo_id: memoId,
			p_process_name: 'transcription',
			p_status: 'completed',
			p_timestamp: timestamp,
			p_details: {
				recoveredAt: timestamp,
				recoveryReason: 'webhook_failure',
			},
		});

		// Update source separately to avoid overwriting metadata
		await supabase
			.from('memos')
			.update({
				source: {},
			})
			.eq('id', memoId);

		// Get updated memo for broadcast
		const { data: newMemo } = await supabase.from('memos').select('*').eq('id', memoId).single();

		// Send broadcast update to notify clients about the recovery
		if (oldMemo && newMemo) {
			try {
				const channel = supabase.channel(`memo-updates-${memoId}`);

				channel.subscribe(async (status) => {
					if (status === 'SUBSCRIBED') {
						await channel.send({
							type: 'broadcast',
							event: 'memo-updated',
							payload: {
								id: memoId,
								old: oldMemo,
								new: newMemo,
								user_id: newMemo.user_id,
							},
						});
						console.log(`Broadcast sent for memo ${memoId} transcription recovery`);
						// Clean up the channel after sending
						supabase.removeChannel(channel);
					}
				});
			} catch (broadcastError) {
				console.warn('Failed to send broadcast update:', broadcastError);
				// Don't fail the function if broadcast fails
			}
		}
	}
}
async function markMemoAsFailed(memoId, error) {
	// Get old memo state for broadcast
	const { data: oldMemo } = await supabase.from('memos').select('*').eq('id', memoId).single();

	const timestamp = new Date().toISOString();
	await supabase.rpc('set_memo_process_error', {
		p_memo_id: memoId,
		p_process_name: 'transcription',
		p_timestamp: timestamp,
		p_reason: error || 'Azure job failed',
		p_details: {
			recoveredAt: timestamp,
			recoveryReason: 'azure_job_failed',
		},
	});

	// Get updated memo for broadcast
	const { data: newMemo } = await supabase.from('memos').select('*').eq('id', memoId).single();

	// Send broadcast update to notify clients about the failure
	if (oldMemo && newMemo) {
		try {
			const channel = supabase.channel(`memo-updates-${memoId}`);

			channel.subscribe(async (status) => {
				if (status === 'SUBSCRIBED') {
					await channel.send({
						type: 'broadcast',
						event: 'memo-updated',
						payload: {
							id: memoId,
							old: oldMemo,
							new: newMemo,
							user_id: newMemo.user_id,
						},
					});
					console.log(`Broadcast sent for memo ${memoId} transcription failure`);
					// Clean up the channel after sending
					supabase.removeChannel(channel);
				}
			});
		} catch (broadcastError) {
			console.warn('Failed to send broadcast update:', broadcastError);
			// Don't fail the function if broadcast fails
		}
	}
}
async function updateTimeout(memoId) {
	// Get old memo state for broadcast
	const { data: oldMemo } = await supabase.from('memos').select('*').eq('id', memoId).single();

	// Extend timeout for long-running jobs - merge fields without changing status
	const timestamp = new Date().toISOString();
	await supabase.rpc('merge_memo_process_fields', {
		p_memo_id: memoId,
		p_process_name: 'transcription',
		p_fields: {
			timeoutExtended: timestamp,
			lastChecked: timestamp,
		},
	});

	// Get updated memo for broadcast
	const { data: newMemo } = await supabase.from('memos').select('*').eq('id', memoId).single();

	// Send broadcast update to notify clients about the timeout extension
	if (oldMemo && newMemo) {
		try {
			const channel = supabase.channel(`memo-updates-${memoId}`);

			channel.subscribe(async (status) => {
				if (status === 'SUBSCRIBED') {
					await channel.send({
						type: 'broadcast',
						event: 'memo-updated',
						payload: {
							id: memoId,
							old: oldMemo,
							new: newMemo,
							user_id: newMemo.user_id,
						},
					});
					console.log(`Broadcast sent for memo ${memoId} timeout extension`);
					// Clean up the channel after sending
					supabase.removeChannel(channel);
				}
			});
		} catch (broadcastError) {
			console.warn('Failed to send broadcast update:', broadcastError);
			// Don't fail the function if broadcast fails
		}
	}
}
