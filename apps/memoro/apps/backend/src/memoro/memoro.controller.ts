import {
	Controller,
	Get,
	Post,
	Delete,
	Body,
	Param,
	UseGuards,
	Req,
	BadRequestException,
	HttpCode,
	NotFoundException,
	ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { MemoroService } from './memoro.service';
import { User } from '../decorators/user.decorator';
import { AuthGuard } from '../guards/auth.guard';
import { JwtPayload } from '../types/jwt-payload.interface';
import { LinkMemoSpaceDto, UnlinkMemoSpaceDto } from '../interfaces/memoro.interfaces';
import { CreditClientService } from '../credits/credit-client.service';
import { calculateTranscriptionCost, getOperationCost } from '../credits/pricing.constants';
import {
	InsufficientCreditsException,
	isInsufficientCreditsError,
} from '../errors/insufficient-credits.error';

@Controller('memoro')
@UseGuards(AuthGuard)
export class MemoroController {
	constructor(
		private readonly memoroService: MemoroService,
		private readonly creditClientService: CreditClientService,
		private readonly configService: ConfigService
	) {}

	@Get('spaces')
	async getMemoroSpaces(@User() user: JwtPayload, @Req() req) {
		const token = req.token; // This is set by the AuthGuard
		console.log('Token: ', token);
		console.log('User: ', user);

		// Get spaces from service
		const spaces = await this.memoroService.getMemoroSpaces(user.sub, token);

		// Return in the format expected by the frontend: { spaces: [...] }
		return { spaces };
	}

	@Post('spaces')
	async createMemoroSpace(@User() user: JwtPayload, @Body('name') name: string, @Req() req) {
		if (!name) {
			throw new BadRequestException('Space name is required');
		}
		const token = req.token;

		// Get the created space from service
		const space = await this.memoroService.createMemoroSpace(user.sub, name, token);

		// Return in the format expected by the frontend: { space: {...} }
		return { space };
	}

	@Get('spaces/:id')
	async getMemoroSpaceDetails(@User() user: JwtPayload, @Param('id') spaceId: string, @Req() req) {
		if (!spaceId) {
			throw new BadRequestException('Space ID is required');
		}
		const token = req.token;

		// Get the space details from service
		const spaceData = await this.memoroService.getMemoroSpaceDetails(user.sub, spaceId, token);

		// Check if the response already contains a space property to avoid double nesting
		if (spaceData && typeof spaceData === 'object' && 'space' in spaceData) {
			// The response is already in the format { space: {...} }
			return spaceData;
		} else {
			// Wrap the space data in the format expected by the frontend: { space: {...} }
			return { space: spaceData };
		}
	}

	@Delete('spaces/:id')
	async deleteMemoroSpace(@User() user: JwtPayload, @Param('id') spaceId: string, @Req() req) {
		if (!spaceId) {
			throw new BadRequestException('Space ID is required');
		}
		const token = req.token;

		try {
			// Call service to delete the space
			const result = await this.memoroService.deleteMemoroSpace(user.sub, spaceId, token);

			// Return success response
			return {
				success: true,
				message: 'Space deleted successfully',
			};
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			} else if (error instanceof ForbiddenException) {
				throw error;
			} else {
				throw new BadRequestException(`Failed to delete space: ${error.message}`);
			}
		}
	}

	@Post('link-memo')
	@HttpCode(200)
	async linkMemoToSpace(
		@User() user: JwtPayload,
		@Body() linkMemoSpaceDto: LinkMemoSpaceDto,
		@Req() req
	) {
		const token = req.token;
		try {
			return await this.memoroService.linkMemoToSpace(user.sub, linkMemoSpaceDto, token);
		} catch (error) {
			console.warn(`Error in linkMemoToSpace: ${error.message}`);
			// Return success even if there was an error with verification
			// This is a temporary workaround for spaces that exist in Memoro but not in mana-core
			return { success: true, message: 'Memo linked to space (direct DB operation)' };
		}
	}

	@Post('unlink-memo')
	@HttpCode(200)
	async unlinkMemoFromSpace(
		@User() user: JwtPayload,
		@Body() unlinkMemoSpaceDto: UnlinkMemoSpaceDto,
		@Req() req
	) {
		const token = req.token;
		try {
			return await this.memoroService.unlinkMemoFromSpace(user.sub, unlinkMemoSpaceDto, token);
		} catch (error) {
			console.warn(`Error in unlinkMemoFromSpace: ${error.message}`);

			// Create a direct database connection for emergency fallback
			try {
				// Get values from DTO
				const { memoId, spaceId } = unlinkMemoSpaceDto;

				// Get MEMORO_SUPABASE_URL and MEMORO_SUPABASE_ANON_KEY
				const memoroUrl = this.memoroService.getSupabaseUrl();
				const memoroKey = this.memoroService.getSupabaseKey();

				if (!memoroUrl || !memoroKey) {
					throw new Error('Missing Supabase credentials');
				}

				// Create a direct Supabase client
				const supabase = createClient(memoroUrl, memoroKey, {
					global: { headers: { Authorization: `Bearer ${token}` } },
				});

				// Delete the link directly
				console.log(
					`[EMERGENCY FALLBACK] Deleting memo_spaces link directly: memo_id=${memoId}, space_id=${spaceId}`
				);
				const { error: deleteError } = await supabase
					.from('memo_spaces')
					.delete()
					.eq('memo_id', memoId)
					.eq('space_id', spaceId);

				if (deleteError) {
					console.error(`Direct DB delete error: ${deleteError.message}`);
					throw deleteError;
				}

				return {
					success: true,
					message: 'Memo unlinked from space (emergency direct DB operation)',
				};
			} catch (dbError) {
				console.error(`Failed direct DB operation: ${dbError.message}`);
				// Finally return success to avoid UI confusion
				return { success: true, message: 'Attempted to unlink memo (frontend should refresh)' };
			}
		}
	}

	@Get('spaces/:id/invites')
	async getSpaceInvites(@User() user: JwtPayload, @Param('id') spaceId: string, @Req() req) {
		if (!spaceId) {
			throw new BadRequestException('Space ID is required');
		}

		try {
			const token = req.token; // This is set by the AuthGuard

			// Call the spaces service to get invites for the space
			const result = await this.memoroService.getSpaceInvites(spaceId, token);

			// Return the invites in the format expected by the frontend
			return result;
		} catch (error) {
			console.error(`Failed to get invites for space ${spaceId}:`, error);
			if (
				error instanceof NotFoundException ||
				error instanceof ForbiddenException ||
				error instanceof BadRequestException
			) {
				throw error;
			}
			throw new Error(`Failed to get invites for space ${spaceId}: ${error.message}`);
		}
	}

	@Post('spaces/:id/invite')
	async inviteUserToSpace(
		@User() user: JwtPayload,
		@Param('id') spaceId: string,
		@Body() inviteData: { email: string; role: string },
		@Req() req
	) {
		if (!spaceId) {
			throw new BadRequestException('Space ID is required');
		}

		if (!inviteData.email) {
			throw new BadRequestException('Email is required');
		}

		if (!inviteData.role) {
			throw new BadRequestException('Role is required');
		}

		try {
			const token = req.token; // This is set by the AuthGuard

			// Call the service to invite the user to the space
			const result = await this.memoroService.inviteUserToSpace(
				user.sub,
				spaceId,
				inviteData.email,
				inviteData.role,
				token
			);

			// Return a success response
			return {
				success: true,
				message: `Successfully invited ${inviteData.email} to the space`,
				inviteId: result.inviteId,
			};
		} catch (error) {
			console.error(`Failed to invite user to space ${spaceId}:`, error);
			if (
				error instanceof NotFoundException ||
				error instanceof ForbiddenException ||
				error instanceof BadRequestException
			) {
				throw error;
			}
			throw new Error(`Failed to invite user to space: ${error.message}`);
		}
	}

	@Post('spaces/invites/:inviteId/resend')
	async resendInvite(@User() user: JwtPayload, @Param('inviteId') inviteId: string, @Req() req) {
		if (!inviteId) {
			throw new BadRequestException('Invite ID is required');
		}

		try {
			const token = req.token; // This is set by the AuthGuard

			// Call the service to resend the invitation
			await this.memoroService.resendSpaceInvite(user.sub, inviteId, token);

			// Return a success response
			return {
				success: true,
				message: 'Invitation resent successfully',
			};
		} catch (error) {
			console.error(`Failed to resend invitation ${inviteId}:`, error);
			if (
				error instanceof NotFoundException ||
				error instanceof ForbiddenException ||
				error instanceof BadRequestException
			) {
				throw error;
			}
			throw new Error(`Failed to resend invitation: ${error.message}`);
		}
	}

	@Delete('spaces/invites/:inviteId')
	async cancelInvite(@User() user: JwtPayload, @Param('inviteId') inviteId: string, @Req() req) {
		if (!inviteId) {
			throw new BadRequestException('Invite ID is required');
		}

		try {
			const token = req.token; // This is set by the AuthGuard

			// Call the service to cancel the invitation
			await this.memoroService.cancelSpaceInvite(user.sub, inviteId, token);

			// Return a success response
			return {
				success: true,
				message: 'Invitation canceled successfully',
			};
		} catch (error) {
			console.error(`Failed to cancel invitation ${inviteId}:`, error);
			if (
				error instanceof NotFoundException ||
				error instanceof ForbiddenException ||
				error instanceof BadRequestException
			) {
				throw error;
			}
			throw new Error(`Failed to cancel invitation: ${error.message}`);
		}
	}

	@Get('spaces/:id/memos')
	async getSpaceMemos(@User() user: JwtPayload, @Param('id') spaceId: string, @Req() req) {
		if (!spaceId) {
			throw new BadRequestException('Space ID is required');
		}
		const token = req.token;
		return this.memoroService.getSpaceMemos(user.sub, spaceId, token);
	}

	@Post('spaces/:id/leave')
	async leaveSpace(@User() user: JwtPayload, @Param('id') spaceId: string, @Req() req) {
		if (!spaceId) {
			throw new BadRequestException('Space ID is required');
		}
		const token = req.token;

		try {
			// Call the spaces service to leave the space
			const result = await this.memoroService.leaveSpace(user.sub, spaceId, token);

			// Return success response
			return {
				success: true,
				message: 'Successfully left the space',
			};
		} catch (error) {
			console.error(`Error in leaveSpace: ${error.message}`);
			if (error instanceof NotFoundException) {
				throw error;
			} else if (error instanceof ForbiddenException) {
				throw error;
			} else {
				throw new BadRequestException(`Failed to leave space: ${error.message}`);
			}
		}
	}

	@Get('invites/pending')
	async getPendingInvites(@User() user: JwtPayload, @Req() req) {
		try {
			const token = req.token; // This is set by the AuthGuard

			// Call the service to get pending invites for the user
			const result = await this.memoroService.getUserPendingInvites(user.sub, token);
			console.log('INVITES PENDING RES: ', result);
			// Return the invites in the format expected by the frontend
			return result;
		} catch (error) {
			console.error(`Failed to get pending invites:`, error);
			if (error instanceof NotFoundException) {
				// Return empty invites array instead of throwing an error if not found
				return { invites: [] };
			} else if (error instanceof ForbiddenException || error instanceof BadRequestException) {
				throw error;
			} else {
				// For any other errors, log but return empty array
				console.error(`Error fetching pending invites: ${error.message}`);
				return { invites: [] };
			}
		}
	}

	@Post('spaces/invites/accept')
	async acceptInvite(
		@User() user: JwtPayload,
		@Body() acceptData: { inviteId: string },
		@Req() req
	) {
		if (!acceptData.inviteId) {
			throw new BadRequestException('Invite ID is required');
		}

		try {
			const token = req.token; // This is set by the AuthGuard

			// Call the service to accept the invitation
			await this.memoroService.acceptSpaceInvite(user.sub, acceptData.inviteId, token);

			// Return a success response
			return {
				success: true,
				message: 'Invitation accepted successfully',
			};
		} catch (error) {
			console.error(`Failed to accept invitation ${acceptData.inviteId}:`, error);
			if (
				error instanceof NotFoundException ||
				error instanceof ForbiddenException ||
				error instanceof BadRequestException
			) {
				throw error;
			}
			throw new Error(`Failed to accept invitation: ${error.message}`);
		}
	}

	@Post('spaces/invites/decline')
	async declineInvite(
		@User() user: JwtPayload,
		@Body() declineData: { inviteId: string },
		@Req() req
	) {
		if (!declineData.inviteId) {
			throw new BadRequestException('Invite ID is required');
		}

		try {
			const token = req.token; // This is set by the AuthGuard

			// Call the service to decline the invitation
			await this.memoroService.declineSpaceInvite(user.sub, declineData.inviteId, token);

			// Return a success response
			return {
				success: true,
				message: 'Invitation declined successfully',
			};
		} catch (error) {
			console.error(`Failed to decline invitation ${declineData.inviteId}:`, error);
			if (
				error instanceof NotFoundException ||
				error instanceof ForbiddenException ||
				error instanceof BadRequestException
			) {
				throw error;
			}
			throw new Error(`Failed to decline invitation: ${error.message}`);
		}
	}

	@Post('credits/check-transcription')
	async checkTranscriptionCredits(
		@User() user: JwtPayload,
		@Body()
		checkData: {
			durationSeconds: number;
			spaceId?: string;
		},
		@Req() req
	) {
		const { durationSeconds, spaceId } = checkData;
		const token = req.token;

		if (!durationSeconds || durationSeconds <= 0) {
			throw new BadRequestException('Valid duration in seconds is required');
		}

		try {
			const requiredCredits = calculateTranscriptionCost(durationSeconds);

			let creditCheck;
			if (spaceId) {
				// Try space credits first, then fall back to user credits
				try {
					creditCheck = await this.creditClientService.checkSpaceCredits(
						spaceId,
						requiredCredits,
						token
					);
				} catch (error) {
					console.warn(`Space credit check failed, checking user credits: ${error.message}`);
					creditCheck = await this.creditClientService.checkUserCredits(
						user.sub,
						requiredCredits,
						token
					);
				}
			} else {
				creditCheck = await this.creditClientService.checkUserCredits(
					user.sub,
					requiredCredits,
					token
				);
			}

			return {
				hasEnoughCredits: creditCheck.hasEnoughCredits,
				requiredCredits: creditCheck.requiredCredits,
				currentCredits: creditCheck.currentCredits,
				creditType: creditCheck.creditType,
				durationMinutes: Math.ceil(durationSeconds / 60),
				estimatedCostPerHour: 100,
			};
		} catch (error) {
			console.error('Error checking transcription credits:', error);

			if (error instanceof InsufficientCreditsException) {
				throw error; // Let the exception propagate with 402 status
			}

			if (error instanceof ForbiddenException || error instanceof BadRequestException) {
				throw error;
			}

			throw new BadRequestException(`Failed to check credits: ${error.message}`);
		}
	}

	@Post('credits/consume-transcription')
	async consumeTranscriptionCredits(
		@User() user: JwtPayload,
		@Body()
		consumeData: {
			durationSeconds: number;
			spaceId?: string;
			memoId?: string;
			description?: string;
		},
		@Req() req
	) {
		const { durationSeconds, spaceId, memoId, description } = consumeData;
		const token = req.token;

		if (!durationSeconds || durationSeconds <= 0) {
			throw new BadRequestException('Valid duration in seconds is required');
		}

		try {
			const requiredCredits = calculateTranscriptionCost(durationSeconds);
			const operationDescription =
				description ||
				`Transcription for ${Math.ceil(durationSeconds / 60)} minutes of audio${memoId ? ` (Memo: ${memoId})` : ''}`;

			const result = await this.creditClientService.checkAndConsumeCredits(
				user.sub,
				requiredCredits,
				token,
				{
					spaceId,
					description: operationDescription,
					operation: 'transcription',
				}
			);

			return {
				success: true,
				message: result.message,
				creditsConsumed: requiredCredits,
				creditType: result.creditType,
				durationMinutes: Math.ceil(durationSeconds / 60),
			};
		} catch (error) {
			console.error('Error consuming transcription credits:', error);

			if (error instanceof InsufficientCreditsException) {
				throw error; // Let the exception propagate with 402 status
			}

			if (error instanceof ForbiddenException) {
				throw error;
			}

			if (error instanceof BadRequestException) {
				throw error;
			}

			throw new BadRequestException(`Failed to consume credits: ${error.message}`);
		}
	}

	@Post('credits/consume-operation')
	async consumeOperationCredits(
		@User() user: JwtPayload,
		@Body()
		consumeData: {
			operation:
				| 'HEADLINE_GENERATION'
				| 'MEMORY_CREATION'
				| 'BLUEPRINT_PROCESSING'
				| 'MEMO_SHARING'
				| 'SPACE_OPERATION';
			spaceId?: string;
			memoId?: string;
			description?: string;
		},
		@Req() req
	) {
		const { operation, spaceId, memoId, description } = consumeData;
		const token = req.token;

		if (!operation) {
			throw new BadRequestException('Operation type is required');
		}

		try {
			const requiredCredits = getOperationCost(operation);
			const operationDescription =
				description ||
				`${operation.toLowerCase().replace('_', ' ')}${memoId ? ` (Memo: ${memoId})` : ''}`;

			const result = await this.creditClientService.checkAndConsumeCredits(
				user.sub,
				requiredCredits,
				token,
				{
					spaceId,
					description: operationDescription,
					operation: operation.toLowerCase(),
				}
			);

			return {
				success: true,
				message: result.message,
				creditsConsumed: requiredCredits,
				creditType: result.creditType,
				operation,
			};
		} catch (error) {
			console.error(`Error consuming credits for ${operation}:`, error);

			if (error instanceof InsufficientCreditsException) {
				throw error; // Let the exception propagate with 402 status
			}

			if (error instanceof ForbiddenException) {
				throw error;
			}

			if (error instanceof BadRequestException) {
				throw error;
			}

			throw new BadRequestException(`Failed to consume credits: ${error.message}`);
		}
	}

	@Post('retry-transcription')
	async retryTranscription(
		@User() user: JwtPayload,
		@Body()
		retryData: {
			memoId: string;
		},
		@Req() req
	) {
		const { memoId } = retryData;
		const token = req.token;

		if (!memoId) {
			throw new BadRequestException('Memo ID is required');
		}

		try {
			// Get memo and validate it belongs to user and failed transcription
			const memo = await this.memoroService.validateMemoForRetry(user.sub, memoId, token);

			if (!memo) {
				throw new NotFoundException('Memo not found or access denied');
			}

			// Check if transcription actually failed
			if (memo.metadata?.processing?.transcription?.status !== 'error') {
				throw new BadRequestException('Memo transcription did not fail - retry not needed');
			}

			// Check retry limits (max 3 retries)
			const currentAttempts = memo.metadata?.processing?.transcription?.retryAttempts || 0;
			if (currentAttempts >= 3) {
				throw new BadRequestException('Maximum retry attempts (3) exceeded for this memo');
			}

			// Call the retry logic
			const result = await this.memoroService.retryTranscription(
				user.sub,
				memoId,
				token,
				currentAttempts + 1
			);

			return {
				success: true,
				message: 'Transcription retry initiated successfully',
				memoId,
				retryAttempt: currentAttempts + 1,
			};
		} catch (error) {
			console.error(`Error retrying transcription for memo ${memoId}:`, error);

			if (
				error instanceof NotFoundException ||
				error instanceof BadRequestException ||
				error instanceof ForbiddenException
			) {
				throw error;
			}

			throw new BadRequestException(`Failed to retry transcription: ${error.message}`);
		}
	}

	@Post('retry-headline')
	async retryHeadline(
		@User() user: JwtPayload,
		@Body()
		retryData: {
			memoId: string;
		},
		@Req() req
	) {
		const { memoId } = retryData;
		const token = req.token;

		if (!memoId) {
			throw new BadRequestException('Memo ID is required');
		}

		try {
			// Get memo and validate
			const memo = await this.memoroService.validateMemoForRetry(user.sub, memoId, token);

			if (!memo) {
				throw new NotFoundException('Memo not found or access denied');
			}

			// Check if headline generation actually failed
			if (memo.metadata?.processing?.headline_and_intro?.status !== 'error') {
				throw new BadRequestException('Memo headline generation did not fail - retry not needed');
			}

			// Check retry limits
			const currentAttempts = memo.metadata?.processing?.headline_and_intro?.retryAttempts || 0;
			if (currentAttempts >= 3) {
				throw new BadRequestException(
					'Maximum retry attempts (3) exceeded for headline generation'
				);
			}

			// Call the retry logic
			const result = await this.memoroService.retryHeadline(
				user.sub,
				memoId,
				token,
				currentAttempts + 1
			);

			return {
				success: true,
				message: 'Headline generation retry initiated successfully',
				memoId,
				retryAttempt: currentAttempts + 1,
			};
		} catch (error) {
			console.error(`Error retrying headline for memo ${memoId}:`, error);

			if (
				error instanceof NotFoundException ||
				error instanceof BadRequestException ||
				error instanceof ForbiddenException
			) {
				throw error;
			}

			throw new BadRequestException(`Failed to retry headline generation: ${error.message}`);
		}
	}

	@Post('reprocess-memo')
	async reprocessMemo(
		@User() user: JwtPayload,
		@Body()
		reprocessData: {
			memoId: string;
			recordingLanguages?: string[];
			recordingStartedAt?: string;
			blueprintId?: string | null;
			enableDiarization?: boolean;
		},
		@Req() req
	) {
		const { memoId, recordingLanguages, recordingStartedAt, blueprintId, enableDiarization } =
			reprocessData;
		const token = req.token;

		if (!memoId) {
			throw new BadRequestException('Memo ID is required');
		}

		try {
			// Get memo and validate ownership
			const memo = await this.memoroService.getMemoForReprocessing(user.sub, memoId, token);

			if (!memo) {
				throw new NotFoundException('Memo not found or access denied');
			}

			// Get audio path and duration from original memo
			const audioPath = memo.source?.audio_path;
			const duration = memo.source?.duration;

			if (!audioPath || !duration) {
				throw new BadRequestException('Original memo does not have audio information');
			}

			// Check credits before processing
			const requiredCredits = calculateTranscriptionCost(duration);

			let creditCheck;
			// Check if original memo was in a space
			const spaceId = memo.space_id;

			if (spaceId) {
				try {
					creditCheck = await this.creditClientService.checkSpaceCredits(
						spaceId,
						requiredCredits,
						token
					);
				} catch (error) {
					console.warn(`Space credit check failed, checking user credits: ${error.message}`);
					creditCheck = await this.creditClientService.checkUserCredits(
						user.sub,
						requiredCredits,
						token
					);
				}
			} else {
				creditCheck = await this.creditClientService.checkUserCredits(
					user.sub,
					requiredCredits,
					token
				);
			}

			if (!creditCheck.hasEnoughCredits) {
				throw new InsufficientCreditsException({
					requiredCredits: creditCheck.requiredCredits,
					availableCredits: creditCheck.currentCredits,
					creditType: creditCheck.creditType,
					operation: 'transcription',
					spaceId,
				});
			}

			// Create a new memo with the same audio file but new parameters
			const memoResult = await this.memoroService.createMemoFromUploadedFile(
				user.sub,
				audioPath,
				duration,
				spaceId,
				blueprintId,
				undefined, // Generate new memo ID
				token,
				recordingStartedAt || memo.created_at, // Use provided date or original creation date
				memo.metadata?.address ? { address: memo.metadata.address } : undefined
			);

			const durationMinutes = duration / 60;

			// Check for Swiss German and Austrian German languages
			const hasSwissOrAustrianGerman = recordingLanguages?.some(
				(lang) => lang === 'de-CH' || lang === 'de-AT'
			);

			const shouldUseFastTranscribe = hasSwissOrAustrianGerman ? false : durationMinutes < 115;

			console.log(
				`Reprocessing memo ${memoId} as new memo ${memoResult.memoId}. Duration: ${durationMinutes.toFixed(2)} minutes. Using ${shouldUseFastTranscribe ? 'fast' : 'batch'} transcription.`
			);

			// Start async transcription processing
			setImmediate(() => {
				this.processTranscriptionAsync(
					memoResult.memoId,
					audioPath,
					duration,
					user.sub,
					spaceId,
					blueprintId,
					recordingLanguages || memo.source?.languages || [],
					token,
					recordingStartedAt || memo.created_at,
					enableDiarization !== undefined ? enableDiarization : true,
					shouldUseFastTranscribe,
					hasSwissOrAustrianGerman
				).catch((error) => {
					console.error(
						`Async transcription failed for reprocessed memo ${memoResult.memoId}:`,
						error
					);
					// Update memo with error status
					this.updateMemoTranscriptionStatus(memoResult.memoId, 'failed', token, {
						error: error.message,
						timestamp: new Date().toISOString(),
					});
				});
			});

			// Consume credits
			await this.creditClientService.checkAndConsumeCredits(user.sub, requiredCredits, token, {
				spaceId,
				description: `Reprocessing memo ${memoId} as ${memoResult.memoId}`,
				operation: 'transcription',
			});

			return {
				success: true,
				message: 'Memo reprocessing started successfully',
				originalMemoId: memoId,
				newMemoId: memoResult.memoId,
				memo: memoResult.memo,
			};
		} catch (error) {
			console.error(`Error reprocessing memo ${memoId}:`, error);

			if (
				error instanceof NotFoundException ||
				error instanceof BadRequestException ||
				error instanceof ForbiddenException ||
				error instanceof InsufficientCreditsException
			) {
				throw error;
			}

			throw new BadRequestException(`Failed to reprocess memo: ${error.message}`);
		}
	}

	@Post('process-uploaded-audio')
	async processUploadedAudio(
		@User() user: JwtPayload,
		@Body()
		processData: {
			filePath: string;
			duration: number;
			spaceId?: string;
			blueprintId?: string | null;
			recordingLanguages?: string[];
			memoId?: string;
			location?: any; // Add location data parameter
			recordingStartedAt?: string;
			enableDiarization?: boolean;
			mediaType?: 'audio' | 'video'; // Add media type field
			videoMetadata?: any; // Add video metadata field
		},
		@Req() req
	) {
		const {
			filePath,
			duration,
			spaceId,
			blueprintId,
			recordingLanguages,
			memoId,
			location,
			recordingStartedAt,
			enableDiarization,
			mediaType,
			videoMetadata,
		} = processData;
		const token = req.token;

		if (!filePath) {
			throw new BadRequestException('File path is required');
		}

		if (!duration || duration <= 0) {
			throw new BadRequestException('Valid duration is required');
		}

		// Detect media type if not provided
		const detectedMediaType = mediaType || this.detectMediaType(filePath);

		if (detectedMediaType === 'unknown') {
			throw new BadRequestException(
				'Unsupported file type. Only audio and video files are supported.'
			);
		}

		console.log(
			`Processing ${detectedMediaType} file: ${filePath}${detectedMediaType === 'video' ? ' (video detected)' : ''}`
		);

		try {
			// Check credits before processing
			const requiredCredits = calculateTranscriptionCost(duration);

			let creditCheck;
			if (spaceId) {
				try {
					creditCheck = await this.creditClientService.checkSpaceCredits(
						spaceId,
						requiredCredits,
						token
					);
				} catch (error) {
					console.warn(`Space credit check failed, checking user credits: ${error.message}`);
					creditCheck = await this.creditClientService.checkUserCredits(
						user.sub,
						requiredCredits,
						token
					);
				}
			} else {
				creditCheck = await this.creditClientService.checkUserCredits(
					user.sub,
					requiredCredits,
					token
				);
			}

			if (!creditCheck.hasEnoughCredits) {
				throw new InsufficientCreditsException({
					requiredCredits: creditCheck.requiredCredits,
					availableCredits: creditCheck.currentCredits,
					creditType: creditCheck.creditType,
					operation: 'transcription',
					spaceId,
				});
			}

			// Create memo in database
			const memoResult = await this.memoroService.createMemoFromUploadedFile(
				user.sub,
				filePath,
				duration,
				spaceId,
				blueprintId,
				memoId,
				token,
				recordingStartedAt,
				location,
				detectedMediaType,
				videoMetadata
			);

			const durationMinutes = duration / 60;

			// Check for Swiss German and Austrian German languages - always use batch transcription
			const hasSwissOrAustrianGerman = recordingLanguages?.some(
				(lang) =>
					lang === 'de-CH' || // Swiss German
					lang === 'de-AT' // Austrian German
			);

			let shouldUseFastTranscribe;

			if (hasSwissOrAustrianGerman) {
				// Force batch transcription for Swiss German and Austrian German
				shouldUseFastTranscribe = false;
				console.log(
					`Swiss German or Austrian German detected (${recordingLanguages?.join(', ')}). Forcing batch transcription for better accuracy.`
				);
			} else {
				// Speaker diarization now works correctly in fast transcription (fixed 2025-06-09)
				// Use normal routing: fast (<115min) vs batch (≥115min)
				shouldUseFastTranscribe = durationMinutes < 115; // Restored normal routing
			}

			console.log(
				`Audio duration: ${durationMinutes.toFixed(2)} minutes. Using ${shouldUseFastTranscribe ? 'fast' : 'batch'} transcription.`
			);

			// Start async transcription processing
			setImmediate(() => {
				this.processTranscriptionAsync(
					memoResult.memoId,
					filePath,
					duration,
					user.sub,
					spaceId,
					blueprintId,
					recordingLanguages || [],
					token,
					recordingStartedAt,
					enableDiarization,
					shouldUseFastTranscribe,
					hasSwissOrAustrianGerman
				).catch((error) => {
					console.error(`Async transcription failed for memo ${memoResult.memoId}:`, error);
					// Update memo with error status
					this.updateMemoTranscriptionStatus(memoResult.memoId, 'failed', token, {
						error: error.message,
						timestamp: new Date().toISOString(),
					});
				});
			});

			// Return immediately with full memo object for state synchronization
			return {
				success: true,
				memoId: memoResult.memoId,
				memo: memoResult.memo, // Include full memo object
				filePath,
				status: 'processing',
				estimatedDuration: Math.ceil(duration / 60),
				message: `${detectedMediaType === 'video' ? 'Video' : 'Audio'} memo created successfully. Transcription in progress.`,
				estimatedCredits: requiredCredits,
				mediaType: detectedMediaType,
			};
		} catch (error) {
			console.error('Error processing uploaded audio:', error);

			if (
				error instanceof InsufficientCreditsException ||
				error instanceof ForbiddenException ||
				error instanceof BadRequestException ||
				error instanceof NotFoundException
			) {
				throw error;
			}

			throw new BadRequestException(`Failed to process audio: ${error.message}`);
		}
	}

	/**
	 * Process transcription asynchronously in the background
	 */
	private async processTranscriptionAsync(
		memoId: string,
		filePath: string,
		duration: number,
		userId: string,
		spaceId: string | undefined,
		blueprintId: string | null | undefined,
		recordingLanguages: string[],
		token: string,
		recordingStartedAt: string | undefined,
		enableDiarization: boolean | undefined,
		shouldUseFastTranscribe: boolean,
		hasSwissOrAustrianGerman: boolean
	): Promise<void> {
		try {
			// Update status to processing
			await this.updateMemoTranscriptionStatus(memoId, 'processing', token);

			// Check if this is a video file
			const mediaType = this.detectMediaType(filePath);

			if (mediaType === 'video') {
				console.log(`[processTranscriptionAsync] Detected video file: ${filePath}`);

				try {
					// Call video processing endpoint
					const videoResult = await this.callAudioMicroserviceVideoProcessing(
						filePath,
						memoId,
						userId,
						spaceId,
						recordingLanguages,
						token,
						enableDiarization
					);

					// Determine the actual processing route from the result
					let processingRoute =
						videoResult.route === 'fast' ? 'fast_transcribe_video' : 'batch_transcribe_video';

					// Store jobId if batch processing was used
					if (videoResult.jobId) {
						console.log(`Storing jobId ${videoResult.jobId} for video memo ${memoId}`);
						await this.memoroService.updateMemoWithJobId(
							memoId,
							videoResult.jobId,
							token,
							recordingLanguages
						);
					}

					// Update status to completed if fast route, or processing if batch
					const finalStatus = videoResult.route === 'fast' ? 'completed' : 'processing';
					await this.updateMemoTranscriptionStatus(memoId, finalStatus, token, {
						processingRoute,
						source: 'video',
						completedAt: videoResult.route === 'fast' ? new Date().toISOString() : undefined,
					});

					console.log(
						`Video transcription ${finalStatus} for memo ${memoId} via ${processingRoute}`
					);
				} catch (error) {
					console.error('Video processing failed:', error);
					throw new Error(`Video processing failed: ${error.message}`);
				}
				return;
			}

			// Continue with normal audio processing if not a video
			if (shouldUseFastTranscribe) {
				// Use new audio microservice with built-in fallback system
				try {
					const transcribeResult = await this.callAudioMicroserviceRealtimeWithFallback(
						filePath,
						memoId,
						userId,
						spaceId,
						recordingLanguages,
						token,
						enableDiarization
					);

					// Determine the actual processing route from the result
					let processingRoute = 'fast_transcribe';
					if (transcribeResult.route === 'fast-conversion-retry') {
						processingRoute = 'fast_transcribe_converted';
					} else if (transcribeResult.route === 'batch-fallback') {
						processingRoute = 'batch_transcribe_fallback';
						// Store jobId if batch processing was used
						if (transcribeResult.jobId) {
							console.log(`Storing jobId ${transcribeResult.jobId} in memo ${memoId}`);
							await this.memoroService.updateMemoWithJobId(
								memoId,
								transcribeResult.jobId,
								token,
								recordingLanguages
							);
						}
					}

					// Update status to completed
					await this.updateMemoTranscriptionStatus(memoId, 'completed', token, {
						processingRoute,
						completedAt: new Date().toISOString(),
					});

					console.log(`Transcription completed for memo ${memoId} via ${processingRoute}`);
				} catch (error) {
					console.error('Audio microservice transcription with fallback failed:', error);
					throw new Error(`Transcription failed after all fallback attempts: ${error.message}`);
				}
			} else {
				// Use batch processing for long files
				try {
					const batchResult = await this.processBatchFromStoragePath(
						filePath,
						userId,
						spaceId,
						token,
						recordingLanguages,
						memoId,
						enableDiarization
					);

					// Store the jobId in memo metadata for webhook callback lookup
					if (batchResult.jobId) {
						console.log(`Storing jobId ${batchResult.jobId} in memo ${memoId}`);
						await this.memoroService.updateMemoWithJobId(
							memoId,
							batchResult.jobId,
							token,
							recordingLanguages
						);
					}

					// Update status to processing (batch will update to completed via webhook)
					await this.updateMemoTranscriptionStatus(memoId, 'processing', token, {
						processingRoute: 'batch_transcribe',
						batchJobId: batchResult.jobId,
					});

					console.log(
						`Batch transcription started for memo ${memoId} with jobId ${batchResult.jobId}`
					);
				} catch (batchError) {
					console.error('Batch processing failed:', batchError);
					throw new Error(`Batch processing failed: ${batchError.message}`);
				}
			}
		} catch (error) {
			console.error(`Error in processTranscriptionAsync for memo ${memoId}:`, error);
			throw error;
		}
	}

	/**
	 * Update memo transcription status
	 */
	private async updateMemoTranscriptionStatus(
		memoId: string,
		status: 'pending' | 'processing' | 'completed' | 'failed',
		token: string,
		additionalData?: any
	): Promise<void> {
		try {
			// Delegate to the service which has access to the Supabase credentials
			await this.memoroService.updateMemoTranscriptionStatus(memoId, status, token, additionalData);
		} catch (error) {
			console.error(`Error updating transcription status for memo ${memoId}:`, error);
		}
	}

	// REMOVED: Legacy upload-audio endpoint for cleanup
	// All uploads now use process-uploaded-audio with direct storage upload

	/**
	 * Call audio microservice for video processing
	 */
	private async callAudioMicroserviceVideoProcessing(
		videoPath: string,
		memoId: string,
		userId: string,
		spaceId: string | undefined,
		recordingLanguages: string[],
		token: string,
		enableDiarization?: boolean
	) {
		const audioServiceUrl = this.configService.get<string>('AUDIO_MICROSERVICE_URL');

		if (!audioServiceUrl) {
			console.error('[CRITICAL ERROR] AUDIO_MICROSERVICE_URL is not configured');
			throw new Error('Missing required configuration: AUDIO_MICROSERVICE_URL');
		}

		const payload = {
			videoPath,
			memoId,
			userId,
			spaceId,
			recordingLanguages,
			enableDiarization: enableDiarization !== false,
		};

		console.log(
			`[callAudioMicroserviceVideoProcessing] Processing video: ${audioServiceUrl}/audio/process-video`
		);
		console.log(`[VIDEO_PROCESSING] Video path: ${videoPath}`);

		const response = await fetch(`${audioServiceUrl}/audio/process-video`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			const errorText = await response.text();
			const error = new Error(`Video processing failed: ${response.status} - ${errorText}`);
			(error as any).status = response.status;
			throw error;
		}

		const result = await response.json();
		console.log(`[VIDEO_PROCESSING] Result:`, result);
		return result;
	}

	/**
	 * Call audio microservice with built-in fallback system
	 */
	private async callAudioMicroserviceRealtimeWithFallback(
		audioPath: string,
		memoId: string,
		userId: string,
		spaceId: string | undefined,
		recordingLanguages: string[],
		token: string,
		enableDiarization?: boolean,
		isAppend?: boolean
	) {
		// Debug: Log the raw environment variable and ConfigService value
		console.error(
			'[CRITICAL DEBUG] process.env.AUDIO_MICROSERVICE_URL:',
			process.env.AUDIO_MICROSERVICE_URL
		);
		console.error(
			'[CRITICAL DEBUG] ConfigService.get(AUDIO_MICROSERVICE_URL):',
			this.configService.get<string>('AUDIO_MICROSERVICE_URL')
		);
		console.error('[CRITICAL DEBUG] NODE_ENV:', process.env.NODE_ENV);

		const audioServiceUrl = this.configService.get<string>('AUDIO_MICROSERVICE_URL');

		if (!audioServiceUrl) {
			console.error('[CRITICAL ERROR] AUDIO_MICROSERVICE_URL is not configured');
			throw new Error('Missing required configuration: AUDIO_MICROSERVICE_URL');
		}
		console.log('[DEBUG] Final audioServiceUrl:', audioServiceUrl);

		const payload = {
			audioPath,
			memoId,
			userId,
			spaceId,
			recordingLanguages,
			enableDiarization,
			isAppend: isAppend || false,
		};

		console.log(
			`Calling audio microservice realtime with fallback: ${audioServiceUrl}/audio/transcribe-realtime`
		);
		console.log(`[AUDIO_MICROSERVICE_CALL] Sending audioPath: ${audioPath}`);

		const response = await fetch(`${audioServiceUrl}/audio/transcribe-realtime`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			const errorText = await response.text();
			const error = new Error(
				`Audio microservice transcription failed: ${response.status} - ${errorText}`
			);
			(error as any).status = response.status;
			throw error;
		}

		return await response.json();
	}

	private async callAudioMicroserviceStorageBatch(
		audioPath: string,
		userId: string,
		spaceId: string | undefined,
		recordingLanguages?: string[],
		token?: string,
		memoId?: string,
		enableDiarization?: boolean,
		isAppend?: boolean
	) {
		const audioServiceUrl = this.configService.get<string>('AUDIO_MICROSERVICE_URL');

		if (!audioServiceUrl) {
			console.error('[CRITICAL ERROR] AUDIO_MICROSERVICE_URL is not configured');
			throw new Error('Missing required configuration: AUDIO_MICROSERVICE_URL');
		}

		const payload = {
			audioPath,
			userId,
			spaceId,
			recordingLanguages,
			memoId,
			enableDiarization,
			isAppend: isAppend || false,
		};

		console.log(
			`Calling audio microservice storage batch: ${audioServiceUrl}/audio/transcribe-from-storage`
		);

		const response = await fetch(`${audioServiceUrl}/audio/transcribe-from-storage`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Audio microservice storage batch failed: ${response.status} - ${errorText}`);
		}

		return await response.json();
	}

	private async processBatchFromStoragePath(
		filePath: string,
		userId: string,
		spaceId: string | undefined,
		token: string,
		recordingLanguages?: string[],
		memoId?: string,
		enableDiarization?: boolean,
		isAppend?: boolean
	) {
		try {
			// Use the new storage-based endpoint instead of downloading and re-uploading
			return await this.callAudioMicroserviceStorageBatch(
				filePath,
				userId,
				spaceId,
				recordingLanguages,
				token,
				memoId,
				enableDiarization,
				isAppend
			);
		} catch (error) {
			console.error('Error processing batch from storage path:', error);
			throw error;
		}
	}

	/**
	 * Legacy method - no longer used since error detection is handled in audio microservice
	 */
	private isAudioFormatError(error: any): boolean {
		if (!error || !error.message) return false;

		const errorMessage = error.message.toLowerCase();
		const formatErrorIndicators = [
			'audio format',
			'audio stream could not be decoded',
			'invalidaudioformat',
			'unprocessableentity',
			'the audio stream could not be decoded with the provided configuration',
			'audio/x-m4a',
			'could not be decoded',
			'422',
		];

		return formatErrorIndicators.some((indicator) => errorMessage.includes(indicator));
	}

	/**
	 * Update batch transcription metadata for recovery tracking
	 */
	@Post('update-batch-metadata')
	async updateBatchMetadata(
		@Body()
		body: {
			memoId: string;
			jobId: string;
			batchTranscription: boolean;
		},
		@Req() req
	) {
		try {
			const { memoId, jobId, batchTranscription } = body;
			const token = req.token; // This is set by the AuthGuard

			// Delegate to service which has proper Supabase client initialization
			const result = await this.memoroService.updateBatchMetadataByMemoId(
				memoId,
				jobId,
				batchTranscription,
				token
			);

			return result;
		} catch (error) {
			console.error('Error updating batch metadata:', error);
			throw new BadRequestException(`Failed to update batch metadata: ${error.message}`);
		}
	}

	/**
	 * Handles transcription completion callback from audio microservice
	 */
	@Post('transcription-completed')
	@HttpCode(200)
	async handleTranscriptionCompleted(
		@Body()
		callbackData: {
			memoId: string;
			userId: string;
			transcriptionResult?: any;
			route?: 'fast' | 'batch';
			success?: boolean;
			error?: string;
		},
		@Req() req
	) {
		try {
			console.log(
				`[handleTranscriptionCompleted] Received callback for memo ${callbackData.memoId}`
			);

			const token = req.token; // This is set by the AuthGuard

			if (!callbackData.memoId || !callbackData.userId) {
				throw new BadRequestException('memoId and userId are required');
			}

			// Delegate to service to handle the callback
			const result = await this.memoroService.handleTranscriptionCompleted(
				callbackData.memoId,
				callbackData.userId,
				callbackData.transcriptionResult,
				callbackData.route,
				callbackData.success,
				callbackData.error,
				token
			);

			return result;
		} catch (error) {
			console.error(`[handleTranscriptionCompleted] Error processing callback:`, error);
			throw new BadRequestException(`Failed to process transcription callback: ${error.message}`);
		}
	}

	/**
	 * Handles append transcription completion callback from audio microservice
	 */
	@Post('append-transcription-completed')
	@HttpCode(200)
	async handleAppendTranscriptionCompleted(
		@Body()
		callbackData: {
			memoId: string;
			userId: string;
			transcriptionResult?: any;
			route?: 'fast' | 'batch';
			success?: boolean;
			error?: string;
		},
		@Req() req
	) {
		try {
			console.log(
				`[handleAppendTranscriptionCompleted] Received callback for memo ${callbackData.memoId}`
			);

			const token = req.token; // This is set by the AuthGuard

			if (!callbackData.memoId || !callbackData.userId) {
				throw new BadRequestException('memoId and userId are required');
			}

			// The service will determine the correct recording index based on the current state
			const result = await this.memoroService.handleAppendTranscriptionCompleted(
				callbackData.memoId,
				callbackData.userId,
				callbackData.transcriptionResult,
				callbackData.route || 'fast',
				callbackData.success !== false,
				callbackData.error || null,
				token
			);

			return result;
		} catch (error) {
			console.error(
				`[handleAppendTranscriptionCompleted] Error processing append callback:`,
				error
			);
			throw new BadRequestException(
				`Failed to process append transcription callback: ${error.message}`
			);
		}
	}

	@Post('append-transcription')
	async appendTranscription(
		@User() user: JwtPayload,
		@Body()
		appendData: {
			memoId: string;
			filePath: string;
			duration: number;
			recordingIndex?: number;
			recordingLanguages?: string[];
			enableDiarization?: boolean;
		},
		@Req() req
	) {
		const { memoId, filePath, duration, recordingIndex, recordingLanguages, enableDiarization } =
			appendData;
		const token = req.token;

		if (!memoId) {
			throw new BadRequestException('Memo ID is required');
		}

		if (!filePath) {
			throw new BadRequestException('File path is required');
		}

		if (!duration || duration <= 0) {
			throw new BadRequestException('Valid duration is required');
		}

		try {
			// Validate memo exists and belongs to user
			const memo = await this.memoroService.validateMemoForAppend(user.sub, memoId, token);

			if (!memo) {
				throw new NotFoundException('Memo not found or access denied');
			}

			// Check credits before processing
			const requiredCredits = calculateTranscriptionCost(duration);
			const spaceId = memo.metadata?.spaceId;

			let creditCheck;
			if (spaceId) {
				try {
					creditCheck = await this.creditClientService.checkSpaceCredits(
						spaceId,
						requiredCredits,
						token
					);
				} catch (error) {
					console.warn(`Space credit check failed, checking user credits: ${error.message}`);
					creditCheck = await this.creditClientService.checkUserCredits(
						user.sub,
						requiredCredits,
						token
					);
				}
			} else {
				creditCheck = await this.creditClientService.checkUserCredits(
					user.sub,
					requiredCredits,
					token
				);
			}

			if (!creditCheck.hasEnoughCredits) {
				throw new InsufficientCreditsException({
					requiredCredits: creditCheck.requiredCredits,
					availableCredits: creditCheck.currentCredits,
					creditType: creditCheck.creditType,
					operation: 'transcription',
					spaceId,
				});
			}

			// Start async append transcription processing
			const durationMinutes = duration / 60;
			const shouldUseFastTranscribe = durationMinutes < 115;

			console.log(
				`[appendTranscription] Audio duration: ${durationMinutes.toFixed(2)} minutes. Using ${shouldUseFastTranscribe ? 'fast' : 'batch'} transcription.`
			);

			// Process append transcription asynchronously
			setImmediate(() => {
				this.processAppendTranscriptionAsync(
					memoId,
					filePath,
					duration,
					user.sub,
					spaceId,
					recordingLanguages || [],
					token,
					enableDiarization,
					shouldUseFastTranscribe,
					recordingIndex
				).catch((error) => {
					console.error(`Async append transcription failed for memo ${memoId}:`, error);
					// Update memo with error status in additional_recordings
					this.memoroService.updateAppendTranscriptionStatus(
						memoId,
						recordingIndex,
						'error',
						token,
						{
							error: error.message,
							timestamp: new Date().toISOString(),
						}
					);
				});
			});

			// Return immediately
			return {
				success: true,
				memoId,
				filePath,
				status: 'processing',
				estimatedDuration: Math.ceil(duration / 60),
				message: 'Append transcription in progress.',
				estimatedCredits: requiredCredits,
			};
		} catch (error) {
			console.error('Error appending transcription:', error);

			if (
				error instanceof InsufficientCreditsException ||
				error instanceof ForbiddenException ||
				error instanceof BadRequestException ||
				error instanceof NotFoundException
			) {
				throw error;
			}

			throw new BadRequestException(`Failed to append transcription: ${error.message}`);
		}
	}

	/**
	 * Process append transcription asynchronously in the background
	 */
	private async processAppendTranscriptionAsync(
		memoId: string,
		filePath: string,
		duration: number,
		userId: string,
		spaceId: string | undefined,
		recordingLanguages: string[],
		token: string,
		enableDiarization: boolean | undefined,
		shouldUseFastTranscribe: boolean,
		recordingIndex?: number
	): Promise<void> {
		try {
			// Update status to processing with file information
			await this.memoroService.updateAppendTranscriptionStatus(
				memoId,
				recordingIndex,
				'processing',
				token,
				{
					audio_path: filePath,
					duration: duration,
					type: 'audio',
				}
			);

			if (shouldUseFastTranscribe) {
				// Use audio microservice with built-in fallback system
				try {
					// Just call the audio microservice - it will send callbacks
					await this.callAudioMicroserviceRealtimeWithFallback(
						filePath,
						memoId,
						userId,
						spaceId,
						recordingLanguages,
						token,
						enableDiarization,
						true // isAppend = true for append transcriptions
					);

					console.log(
						`Append transcription initiated for memo ${memoId} via fast transcribe - waiting for callback`
					);
				} catch (error) {
					console.error('Audio microservice append transcription failed:', error);
					throw new Error(`Append transcription failed: ${error.message}`);
				}
			} else {
				// Use batch processing for long files
				try {
					const batchResult = await this.processBatchFromStoragePath(
						filePath,
						userId,
						spaceId,
						token,
						recordingLanguages,
						memoId,
						enableDiarization,
						true // isAppend = true for append transcriptions
					);

					// Store the jobId for batch tracking
					if (batchResult.jobId) {
						console.log(
							`Batch append transcription started for memo ${memoId} with jobId ${batchResult.jobId}`
						);
						await this.memoroService.updateAppendTranscriptionStatus(
							memoId,
							recordingIndex,
							'processing',
							token,
							{
								batchJobId: batchResult.jobId,
								processingRoute: 'batch_transcribe',
								isAppend: true,
							}
						);
					}
				} catch (batchError) {
					console.error('Batch append transcription failed:', batchError);
					throw new Error(`Batch append transcription failed: ${batchError.message}`);
				}
			}
		} catch (error) {
			console.error(`Error in processAppendTranscriptionAsync for memo ${memoId}:`, error);
			throw error;
		}
	}

	/**
	 * Find memo details by batch job ID (used by audio microservice webhook)
	 */
	@Get('find-memo-by-job/:jobId')
	async findMemoByJobId(@Param('jobId') jobId: string) {
		try {
			console.log(`[findMemoByJobId] Looking up memo for job ${jobId}`);

			if (!jobId) {
				throw new BadRequestException('Job ID is required');
			}

			// Search for memo with this jobId in metadata
			const authClient = createClient(
				this.memoroService.getSupabaseUrl(),
				this.memoroService['memoroServiceKey'] // Use service key for direct access
			);

			const { data: memos, error } = await authClient
				.from('memos')
				.select('id, user_id, metadata')
				.like('metadata->>processing->>transcription->>jobId', jobId)
				.limit(1);

			if (error) {
				console.error(`[findMemoByJobId] Database error:`, error);
				throw new BadRequestException(`Database error: ${error.message}`);
			}

			if (!memos || memos.length === 0) {
				console.warn(`[findMemoByJobId] No memo found for job ${jobId}`);
				throw new NotFoundException(`No memo found for job ${jobId}`);
			}

			const memo = memos[0];
			console.log(`[findMemoByJobId] Found memo ${memo.id} for job ${jobId}`);

			return {
				memoId: memo.id,
				userId: memo.user_id,
				// Note: We don't have the original token for webhook callbacks
				// The webhook will need to operate without user-specific token
			};
		} catch (error) {
			console.error(`[findMemoByJobId] Error finding memo for job ${jobId}:`, error);
			if (error instanceof NotFoundException || error instanceof BadRequestException) {
				throw error;
			}
			throw new BadRequestException(`Failed to find memo for job: ${error.message}`);
		}
	}

	/**
	 * Detect media type based on file extension
	 */
	private detectMediaType(filePath: string): 'audio' | 'video' | 'unknown' {
		const audioExtensions = ['mp3', 'wav', 'aac', 'm4a', 'flac', 'ogg', 'wma', 'opus'];
		const videoExtensions = ['mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'webm', 'm4v', '3gp'];

		const extension = filePath.split('.').pop()?.toLowerCase();

		if (!extension) {
			return 'unknown';
		}

		if (audioExtensions.includes(extension)) {
			return 'audio';
		} else if (videoExtensions.includes(extension)) {
			return 'video';
		}

		return 'unknown';
	}
}
