import {
	Injectable,
	BadRequestException,
	NotFoundException,
	ConflictException,
	ForbiddenException,
	Inject,
	forwardRef,
	Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, and, sql, desc, sum } from 'drizzle-orm';
import { getDb } from '../db/connection';
import {
	balances,
	transactions,
	purchases,
	packages,
	usageStats,
	organizationBalances,
	creditAllocations,
	members,
	organizations,
	users,
} from '../db/schema';
import { UseCreditsDto } from './dto/use-credits.dto';
import { AllocateCreditsDto } from './dto/allocate-credits.dto';
import { StripeService } from '../stripe/stripe.service';

@Injectable()
export class CreditsService {
	private readonly logger = new Logger(CreditsService.name);

	constructor(
		private configService: ConfigService,
		@Inject(forwardRef(() => StripeService))
		private stripeService: StripeService
	) {}

	private getDb() {
		const databaseUrl = this.configService.get<string>('database.url');
		return getDb(databaseUrl!);
	}

	async initializeUserBalance(userId: string) {
		const db = this.getDb();
		const signupBonus = this.configService.get<number>('credits.signupBonus') || 150;
		const dailyFreeCredits = this.configService.get<number>('credits.dailyFreeCredits') || 5;

		// Check if balance already exists
		const [existingBalance] = await db
			.select()
			.from(balances)
			.where(eq(balances.userId, userId))
			.limit(1);

		if (existingBalance) {
			return existingBalance;
		}

		// Create initial balance with signup bonus
		const [balance] = await db
			.insert(balances)
			.values({
				userId,
				balance: 0,
				freeCreditsRemaining: signupBonus,
				dailyFreeCredits,
				lastDailyResetAt: new Date(),
			})
			.returning();

		// Create transaction record for signup bonus
		await db.insert(transactions).values({
			userId,
			type: 'bonus',
			status: 'completed',
			amount: signupBonus,
			balanceBefore: 0,
			balanceAfter: 0,
			appId: 'system',
			description: 'Signup bonus',
			completedAt: new Date(),
		});

		return balance;
	}

	async getBalance(userId: string) {
		const db = this.getDb();

		// Check and apply daily free credits reset
		await this.checkDailyReset(userId);

		const [balance] = await db.select().from(balances).where(eq(balances.userId, userId)).limit(1);

		if (!balance) {
			// Initialize balance if it doesn't exist
			return this.initializeUserBalance(userId);
		}

		return {
			balance: balance.balance,
			freeCreditsRemaining: balance.freeCreditsRemaining,
			totalEarned: balance.totalEarned,
			totalSpent: balance.totalSpent,
			dailyFreeCredits: balance.dailyFreeCredits,
		};
	}

	async useCredits(userId: string, useCreditsDto: UseCreditsDto) {
		const db = this.getDb();

		// Check for idempotency
		if (useCreditsDto.idempotencyKey) {
			const [existingTransaction] = await db
				.select()
				.from(transactions)
				.where(eq(transactions.idempotencyKey, useCreditsDto.idempotencyKey))
				.limit(1);

			if (existingTransaction) {
				return {
					success: true,
					transaction: existingTransaction,
					message: 'Transaction already processed',
				};
			}
		}

		// Use a transaction for atomicity
		return await db.transaction(async (tx) => {
			// Get current balance with row lock (SELECT FOR UPDATE)
			const [currentBalance] = await tx
				.select()
				.from(balances)
				.where(eq(balances.userId, userId))
				.for('update')
				.limit(1);

			if (!currentBalance) {
				throw new NotFoundException('User balance not found');
			}

			const totalAvailable = currentBalance.balance + currentBalance.freeCreditsRemaining;

			if (totalAvailable < useCreditsDto.amount) {
				throw new BadRequestException('Insufficient credits');
			}

			// Calculate deduction from free and paid credits
			const freeCreditsUsed = Math.min(useCreditsDto.amount, currentBalance.freeCreditsRemaining);
			const paidCreditsUsed = useCreditsDto.amount - freeCreditsUsed;

			const newFreeCredits = currentBalance.freeCreditsRemaining - freeCreditsUsed;
			const newBalance = currentBalance.balance - paidCreditsUsed;
			const newTotalSpent = currentBalance.totalSpent + useCreditsDto.amount;

			// Update balance with optimistic locking
			const updateResult = await tx
				.update(balances)
				.set({
					balance: newBalance,
					freeCreditsRemaining: newFreeCredits,
					totalSpent: newTotalSpent,
					version: currentBalance.version + 1,
					updatedAt: new Date(),
				})
				.where(and(eq(balances.userId, userId), eq(balances.version, currentBalance.version)))
				.returning();

			if (updateResult.length === 0) {
				throw new ConflictException('Balance was modified by another transaction. Please retry.');
			}

			// Create transaction record
			const [transaction] = await tx
				.insert(transactions)
				.values({
					userId,
					type: 'usage',
					status: 'completed',
					amount: -useCreditsDto.amount,
					balanceBefore: currentBalance.balance + currentBalance.freeCreditsRemaining,
					balanceAfter: newBalance + newFreeCredits,
					appId: useCreditsDto.appId,
					description: useCreditsDto.description,
					metadata: useCreditsDto.metadata,
					idempotencyKey: useCreditsDto.idempotencyKey,
					completedAt: new Date(),
				})
				.returning();

			// Track usage stats (for analytics)
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			await tx.insert(usageStats).values({
				userId,
				appId: useCreditsDto.appId,
				creditsUsed: useCreditsDto.amount,
				date: today,
				metadata: useCreditsDto.metadata,
			});

			return {
				success: true,
				transaction,
				newBalance: {
					balance: newBalance,
					freeCreditsRemaining: newFreeCredits,
					totalSpent: newTotalSpent,
				},
			};
		});
	}

	async getTransactionHistory(userId: string, limit = 50, offset = 0) {
		const db = this.getDb();

		const transactionList = await db
			.select()
			.from(transactions)
			.where(eq(transactions.userId, userId))
			.orderBy(desc(transactions.createdAt))
			.limit(limit)
			.offset(offset);

		return transactionList;
	}

	async getPurchaseHistory(userId: string) {
		const db = this.getDb();

		return await db
			.select()
			.from(purchases)
			.where(eq(purchases.userId, userId))
			.orderBy(desc(purchases.createdAt));
	}

	async getPackages() {
		const db = this.getDb();

		return await db
			.select()
			.from(packages)
			.where(eq(packages.active, true))
			.orderBy(packages.sortOrder);
	}

	private async checkDailyReset(userId: string) {
		const db = this.getDb();

		const [balance] = await db.select().from(balances).where(eq(balances.userId, userId)).limit(1);

		if (!balance) {
			return;
		}

		const now = new Date();
		const lastReset = balance.lastDailyResetAt;

		// Check if last reset was on a different day
		if (
			!lastReset ||
			lastReset.getDate() !== now.getDate() ||
			lastReset.getMonth() !== now.getMonth() ||
			lastReset.getFullYear() !== now.getFullYear()
		) {
			// Reset daily free credits
			await db
				.update(balances)
				.set({
					freeCreditsRemaining: balance.freeCreditsRemaining + balance.dailyFreeCredits,
					lastDailyResetAt: now,
					updatedAt: now,
				})
				.where(eq(balances.userId, userId));

			// Create transaction record for daily bonus
			await db.insert(transactions).values({
				userId,
				type: 'bonus',
				status: 'completed',
				amount: balance.dailyFreeCredits,
				balanceBefore: balance.balance + balance.freeCreditsRemaining,
				balanceAfter: balance.balance + balance.freeCreditsRemaining + balance.dailyFreeCredits,
				appId: 'system',
				description: 'Daily free credits',
				completedAt: now,
			});
		}
	}

	// ============================================================================
	// ORGANIZATION CREDIT METHODS (B2B)
	// ============================================================================

	/**
	 * Create organization credit balance
	 * Called when a new organization is created
	 */
	async createOrganizationCreditBalance(organizationId: string) {
		const db = this.getDb();

		// Check if balance already exists
		const [existingBalance] = await db
			.select()
			.from(organizationBalances)
			.where(eq(organizationBalances.organizationId, organizationId))
			.limit(1);

		if (existingBalance) {
			return existingBalance;
		}

		// Create initial balance
		const [balance] = await db
			.insert(organizationBalances)
			.values({
				organizationId,
				balance: 0,
				allocatedCredits: 0,
				availableCredits: 0,
				totalPurchased: 0,
				totalAllocated: 0,
			})
			.returning();

		return balance;
	}

	/**
	 * Create personal credit balance (B2C user)
	 * Alias for initializeUserBalance for clarity
	 */
	async createPersonalCreditBalance(userId: string) {
		return this.initializeUserBalance(userId);
	}

	/**
	 * Allocate credits from organization to employee
	 * Only organization owners can allocate credits
	 */
	async allocateCredits(allocatorUserId: string, allocateDto: AllocateCreditsDto) {
		const db = this.getDb();
		const { organizationId, employeeId, amount, reason } = allocateDto;

		return await db.transaction(async (tx) => {
			// 1. Verify allocator has 'owner' role in the organization
			const [member] = await tx
				.select()
				.from(members)
				.where(and(eq(members.organizationId, organizationId), eq(members.userId, allocatorUserId)))
				.limit(1);

			if (!member || member.role !== 'owner') {
				throw new ForbiddenException('Only organization owners can allocate credits');
			}

			// 2. Get organization balance with row lock
			const [orgBalance] = await tx
				.select()
				.from(organizationBalances)
				.where(eq(organizationBalances.organizationId, organizationId))
				.for('update')
				.limit(1);

			if (!orgBalance) {
				throw new NotFoundException('Organization balance not found');
			}

			// 3. Check if organization has sufficient available credits
			if (orgBalance.availableCredits < amount) {
				throw new BadRequestException(
					`Insufficient organization credits. Available: ${orgBalance.availableCredits}, Requested: ${amount}`
				);
			}

			// 4. Get or create employee balance with row lock
			let employeeBalance = await tx
				.select()
				.from(balances)
				.where(eq(balances.userId, employeeId))
				.for('update')
				.limit(1)
				.then((rows) => rows[0]);

			if (!employeeBalance) {
				// Initialize employee balance within the transaction
				const signupBonus = this.configService.get<number>('credits.signupBonus') || 150;
				const dailyFreeCredits = this.configService.get<number>('credits.dailyFreeCredits') || 5;

				const [newBalance] = await tx
					.insert(balances)
					.values({
						userId: employeeId,
						balance: 0,
						freeCreditsRemaining: signupBonus,
						dailyFreeCredits,
						lastDailyResetAt: new Date(),
					})
					.returning();

				employeeBalance = newBalance;
			}

			const currentEmployeeBalance = employeeBalance.balance;
			const newEmployeeBalance = currentEmployeeBalance + amount;

			// 5. Update organization balance
			const newAllocatedCredits = orgBalance.allocatedCredits + amount;
			const newAvailableCredits = orgBalance.balance - newAllocatedCredits;

			const updateOrgResult = await tx
				.update(organizationBalances)
				.set({
					allocatedCredits: newAllocatedCredits,
					availableCredits: newAvailableCredits,
					totalAllocated: orgBalance.totalAllocated + amount,
					version: orgBalance.version + 1,
					updatedAt: new Date(),
				})
				.where(
					and(
						eq(organizationBalances.organizationId, organizationId),
						eq(organizationBalances.version, orgBalance.version)
					)
				)
				.returning();

			if (updateOrgResult.length === 0) {
				throw new ConflictException(
					'Organization balance was modified by another transaction. Please retry.'
				);
			}

			// 6. Update employee balance
			const updateEmployeeResult = await tx
				.update(balances)
				.set({
					balance: newEmployeeBalance,
					totalEarned: employeeBalance.totalEarned + amount,
					version: employeeBalance.version + 1,
					updatedAt: new Date(),
				})
				.where(and(eq(balances.userId, employeeId), eq(balances.version, employeeBalance.version)))
				.returning();

			if (updateEmployeeResult.length === 0) {
				throw new ConflictException(
					'Employee balance was modified by another transaction. Please retry.'
				);
			}

			// 7. Create allocation record (audit trail)
			const [allocation] = await tx
				.insert(creditAllocations)
				.values({
					organizationId,
					employeeId,
					amount,
					allocatedBy: allocatorUserId,
					reason: reason || 'Credit allocation',
					balanceBefore: currentEmployeeBalance,
					balanceAfter: newEmployeeBalance,
				})
				.returning();

			// 8. Create transaction record for employee
			await tx.insert(transactions).values({
				userId: employeeId,
				type: 'bonus',
				status: 'completed',
				amount,
				balanceBefore: currentEmployeeBalance,
				balanceAfter: newEmployeeBalance,
				appId: 'organization',
				description: `Credit allocation from organization: ${reason || 'N/A'}`,
				organizationId,
				completedAt: new Date(),
			});

			return {
				success: true,
				allocation,
				organizationBalance: {
					balance: orgBalance.balance,
					allocatedCredits: newAllocatedCredits,
					availableCredits: newAvailableCredits,
				},
				employeeBalance: {
					balance: newEmployeeBalance,
				},
			};
		});
	}

	/**
	 * Get employee's credit balance (allocated from organization)
	 * Returns the employee's personal balance
	 */
	async getEmployeeCreditBalance(userId: string, organizationId?: string) {
		const db = this.getDb();

		// Get employee's personal balance
		const [balance] = await db.select().from(balances).where(eq(balances.userId, userId)).limit(1);

		if (!balance) {
			return null;
		}

		return {
			balance: balance.balance,
			freeCreditsRemaining: balance.freeCreditsRemaining,
			totalEarned: balance.totalEarned,
			totalSpent: balance.totalSpent,
		};
	}

	/**
	 * Get personal credit balance (B2C user)
	 * Alias for getBalance for clarity
	 */
	async getPersonalCreditBalance(userId: string) {
		return this.getBalance(userId);
	}

	/**
	 * Get organization balance and allocation statistics
	 */
	async getOrganizationBalance(organizationId: string) {
		const db = this.getDb();

		// Get organization balance
		const [orgBalance] = await db
			.select()
			.from(organizationBalances)
			.where(eq(organizationBalances.organizationId, organizationId))
			.limit(1);

		if (!orgBalance) {
			throw new NotFoundException('Organization balance not found');
		}

		// Get allocation statistics
		const allocations = await db
			.select()
			.from(creditAllocations)
			.where(eq(creditAllocations.organizationId, organizationId))
			.orderBy(desc(creditAllocations.createdAt))
			.limit(10); // Last 10 allocations

		return {
			balance: orgBalance.balance,
			allocatedCredits: orgBalance.allocatedCredits,
			availableCredits: orgBalance.availableCredits,
			totalPurchased: orgBalance.totalPurchased,
			totalAllocated: orgBalance.totalAllocated,
			recentAllocations: allocations,
		};
	}

	/**
	 * Deduct credits with organization tracking
	 * Enhanced version of useCredits that tracks organization_id for B2B users
	 */
	async deductCredits(userId: string, useCreditsDto: UseCreditsDto, organizationId?: string) {
		const db = this.getDb();

		// Check for idempotency
		if (useCreditsDto.idempotencyKey) {
			const [existingTransaction] = await db
				.select()
				.from(transactions)
				.where(eq(transactions.idempotencyKey, useCreditsDto.idempotencyKey))
				.limit(1);

			if (existingTransaction) {
				return {
					success: true,
					transaction: existingTransaction,
					message: 'Transaction already processed',
				};
			}
		}

		// Use a transaction for atomicity
		return await db.transaction(async (tx) => {
			// Get current balance with row lock
			const [currentBalance] = await tx
				.select()
				.from(balances)
				.where(eq(balances.userId, userId))
				.for('update')
				.limit(1);

			if (!currentBalance) {
				throw new NotFoundException('User balance not found');
			}

			const totalAvailable = currentBalance.balance + currentBalance.freeCreditsRemaining;

			if (totalAvailable < useCreditsDto.amount) {
				throw new BadRequestException('Insufficient credits');
			}

			// Calculate deduction from free and paid credits
			const freeCreditsUsed = Math.min(useCreditsDto.amount, currentBalance.freeCreditsRemaining);
			const paidCreditsUsed = useCreditsDto.amount - freeCreditsUsed;

			const newFreeCredits = currentBalance.freeCreditsRemaining - freeCreditsUsed;
			const newBalance = currentBalance.balance - paidCreditsUsed;
			const newTotalSpent = currentBalance.totalSpent + useCreditsDto.amount;

			// Update balance
			const updateResult = await tx
				.update(balances)
				.set({
					balance: newBalance,
					freeCreditsRemaining: newFreeCredits,
					totalSpent: newTotalSpent,
					version: currentBalance.version + 1,
					updatedAt: new Date(),
				})
				.where(and(eq(balances.userId, userId), eq(balances.version, currentBalance.version)))
				.returning();

			if (updateResult.length === 0) {
				throw new ConflictException('Balance was modified by another transaction. Please retry.');
			}

			// Create transaction record with organization_id
			const [transaction] = await tx
				.insert(transactions)
				.values({
					userId,
					type: 'usage',
					status: 'completed',
					amount: -useCreditsDto.amount,
					balanceBefore: currentBalance.balance + currentBalance.freeCreditsRemaining,
					balanceAfter: newBalance + newFreeCredits,
					appId: useCreditsDto.appId,
					description: useCreditsDto.description,
					organizationId: organizationId || null, // Track organization for B2B
					metadata: useCreditsDto.metadata,
					idempotencyKey: useCreditsDto.idempotencyKey,
					completedAt: new Date(),
				})
				.returning();

			// Track usage stats
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			await tx.insert(usageStats).values({
				userId,
				appId: useCreditsDto.appId,
				creditsUsed: useCreditsDto.amount,
				date: today,
				metadata: useCreditsDto.metadata,
			});

			return {
				success: true,
				transaction,
				newBalance: {
					balance: newBalance,
					freeCreditsRemaining: newFreeCredits,
					totalSpent: newTotalSpent,
				},
			};
		});
	}

	// ============================================================================
	// STRIPE PURCHASE METHODS
	// ============================================================================

	/**
	 * Initiate a credit purchase
	 * Creates a pending purchase record and Stripe PaymentIntent
	 */
	async initiatePurchase(
		userId: string,
		packageId: string
	): Promise<{
		purchaseId: string;
		clientSecret: string;
		amount: number;
		credits: number;
	}> {
		const db = this.getDb();

		// 1. Get package details
		const [pkg] = await db
			.select()
			.from(packages)
			.where(and(eq(packages.id, packageId), eq(packages.active, true)))
			.limit(1);

		if (!pkg) {
			throw new NotFoundException('Package not found or inactive');
		}

		// 2. Get user email for Stripe customer
		const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

		if (!user) {
			throw new NotFoundException('User not found');
		}

		// 3. Get or create Stripe customer
		const stripeCustomerId = await this.stripeService.getOrCreateCustomer(userId, user.email);

		// 4. Create pending purchase record
		const [purchase] = await db
			.insert(purchases)
			.values({
				userId,
				packageId,
				credits: pkg.credits,
				priceEuroCents: pkg.priceEuroCents,
				stripeCustomerId,
				status: 'pending',
			})
			.returning();

		// 5. Create PaymentIntent
		const paymentIntent = await this.stripeService.createPaymentIntent(
			stripeCustomerId,
			pkg.priceEuroCents,
			{ userId, packageId, purchaseId: purchase.id }
		);

		// 6. Update purchase with PaymentIntent ID
		await db
			.update(purchases)
			.set({ stripePaymentIntentId: paymentIntent.id })
			.where(eq(purchases.id, purchase.id));

		this.logger.log('Purchase initiated', {
			purchaseId: purchase.id,
			userId,
			packageId,
			credits: pkg.credits,
			amount: pkg.priceEuroCents,
		});

		return {
			purchaseId: purchase.id,
			clientSecret: paymentIntent.client_secret!,
			amount: pkg.priceEuroCents,
			credits: pkg.credits,
		};
	}

	/**
	 * Complete a purchase after successful payment
	 * Called from webhook handler - MUST be idempotent
	 */
	async completePurchase(
		paymentIntentId: string
	): Promise<{ success: boolean; alreadyProcessed?: boolean; creditsAdded?: number }> {
		const db = this.getDb();

		return await db.transaction(async (tx) => {
			// 1. Find purchase by PaymentIntent ID
			const [purchase] = await tx
				.select()
				.from(purchases)
				.where(eq(purchases.stripePaymentIntentId, paymentIntentId))
				.for('update')
				.limit(1);

			if (!purchase) {
				throw new NotFoundException('Purchase not found for PaymentIntent');
			}

			// 2. Idempotency check - already completed?
			if (purchase.status === 'completed') {
				return { success: true, alreadyProcessed: true };
			}

			// 3. Validate status transition
			if (purchase.status !== 'pending') {
				throw new BadRequestException(`Cannot complete purchase in status: ${purchase.status}`);
			}

			// 4. Get or create user balance
			let [balance] = await tx
				.select()
				.from(balances)
				.where(eq(balances.userId, purchase.userId))
				.for('update')
				.limit(1);

			if (!balance) {
				// Initialize balance if not exists
				const signupBonus = this.configService.get<number>('credits.signupBonus') || 150;
				const dailyFreeCredits = this.configService.get<number>('credits.dailyFreeCredits') || 5;

				[balance] = await tx
					.insert(balances)
					.values({
						userId: purchase.userId,
						balance: 0,
						freeCreditsRemaining: signupBonus,
						dailyFreeCredits,
						lastDailyResetAt: new Date(),
					})
					.returning();
			}

			const newBalance = balance.balance + purchase.credits;
			const now = new Date();

			// 5. Update balance with optimistic locking
			const updateResult = await tx
				.update(balances)
				.set({
					balance: newBalance,
					totalEarned: balance.totalEarned + purchase.credits,
					version: balance.version + 1,
					updatedAt: now,
				})
				.where(and(eq(balances.userId, purchase.userId), eq(balances.version, balance.version)))
				.returning();

			if (updateResult.length === 0) {
				throw new ConflictException('Balance modified concurrently. Retry.');
			}

			// 6. Update purchase status
			await tx
				.update(purchases)
				.set({
					status: 'completed',
					completedAt: now,
				})
				.where(eq(purchases.id, purchase.id));

			// 7. Create transaction ledger entry
			await tx.insert(transactions).values({
				userId: purchase.userId,
				type: 'purchase',
				status: 'completed',
				amount: purchase.credits,
				balanceBefore: balance.balance,
				balanceAfter: newBalance,
				appId: 'stripe',
				description: `Credit purchase: ${purchase.credits} credits`,
				idempotencyKey: `purchase:${paymentIntentId}`,
				completedAt: now,
				metadata: {
					purchaseId: purchase.id,
					packageId: purchase.packageId,
					stripePaymentIntentId: paymentIntentId,
					priceEuroCents: purchase.priceEuroCents,
				},
			});

			this.logger.log('Purchase completed', {
				purchaseId: purchase.id,
				userId: purchase.userId,
				creditsAdded: purchase.credits,
				newBalance,
			});

			return { success: true, alreadyProcessed: false, creditsAdded: purchase.credits };
		});
	}

	/**
	 * Mark a purchase as failed
	 * Called from webhook handler when payment fails
	 */
	async failPurchase(paymentIntentId: string, failureReason: string): Promise<void> {
		const db = this.getDb();

		const [purchase] = await db
			.select()
			.from(purchases)
			.where(eq(purchases.stripePaymentIntentId, paymentIntentId))
			.limit(1);

		if (!purchase) {
			this.logger.warn('Purchase not found for failed PaymentIntent', { paymentIntentId });
			return;
		}

		// Only update if still pending
		if (purchase.status !== 'pending') {
			this.logger.debug('Purchase already processed, skipping failure update', {
				purchaseId: purchase.id,
				currentStatus: purchase.status,
			});
			return;
		}

		await db
			.update(purchases)
			.set({
				status: 'failed',
				metadata: {
					...((purchase.metadata as Record<string, unknown>) || {}),
					failureReason,
					failedAt: new Date().toISOString(),
				},
			})
			.where(eq(purchases.id, purchase.id));

		this.logger.log('Purchase marked as failed', {
			purchaseId: purchase.id,
			paymentIntentId,
			failureReason,
		});
	}

	/**
	 * Get purchase status by ID
	 */
	async getPurchaseStatus(userId: string, purchaseId: string) {
		const db = this.getDb();

		const [purchase] = await db
			.select()
			.from(purchases)
			.where(and(eq(purchases.id, purchaseId), eq(purchases.userId, userId)))
			.limit(1);

		if (!purchase) {
			throw new NotFoundException('Purchase not found');
		}

		return {
			id: purchase.id,
			status: purchase.status,
			credits: purchase.credits,
			priceEuroCents: purchase.priceEuroCents,
			createdAt: purchase.createdAt,
			completedAt: purchase.completedAt,
		};
	}

	/**
	 * Update purchase with PaymentIntent ID
	 * Called from webhook when checkout.session.completed fires
	 */
	async updatePurchasePaymentIntent(purchaseId: string, paymentIntentId: string): Promise<void> {
		const db = this.getDb();

		await db
			.update(purchases)
			.set({
				stripePaymentIntentId: paymentIntentId,
			})
			.where(eq(purchases.id, purchaseId));
	}

	// ============================================================================
	// PAYMENT LINK METHODS (for Matrix Bots)
	// ============================================================================

	/**
	 * Create a Stripe Checkout Session URL for credit purchase
	 * Used by Matrix bots to allow users to buy credits without leaving chat
	 */
	async createPaymentLink(
		userId: string,
		packageId: string,
		options?: {
			successUrl?: string;
			cancelUrl?: string;
			roomId?: string;
		}
	): Promise<{
		url: string;
		purchaseId: string;
		expiresAt: Date;
		package: {
			name: string;
			credits: number;
			priceEuroCents: number;
		};
	}> {
		const db = this.getDb();

		// 1. Get package details
		const [pkg] = await db
			.select()
			.from(packages)
			.where(and(eq(packages.id, packageId), eq(packages.active, true)))
			.limit(1);

		if (!pkg) {
			throw new NotFoundException('Package not found or inactive');
		}

		// 2. Get user email for Stripe customer
		const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

		if (!user) {
			throw new NotFoundException('User not found');
		}

		// 3. Get or create Stripe customer
		const stripeCustomerId = await this.stripeService.getOrCreateCustomer(userId, user.email);

		// 4. Create pending purchase record
		const [purchase] = await db
			.insert(purchases)
			.values({
				userId,
				packageId,
				credits: pkg.credits,
				priceEuroCents: pkg.priceEuroCents,
				stripeCustomerId,
				status: 'pending',
				metadata: options?.roomId ? { roomId: options.roomId } : undefined,
			})
			.returning();

		// 5. Build URLs
		const baseUrl = this.configService.get<string>('app.baseUrl') || 'https://mana.how';
		const successUrl = options?.successUrl || `${baseUrl}/credits/success?purchase_id=${purchase.id}`;
		const cancelUrl = options?.cancelUrl || `${baseUrl}/credits/cancelled`;

		// 6. Create Checkout Session
		const session = await this.stripeService.createCheckoutSession({
			customerId: stripeCustomerId,
			amountCents: pkg.priceEuroCents,
			productName: pkg.name,
			credits: pkg.credits,
			metadata: {
				userId,
				packageId,
				purchaseId: purchase.id,
				roomId: options?.roomId,
			},
			successUrl,
			cancelUrl,
		});

		// 7. Update purchase with session ID
		await db
			.update(purchases)
			.set({
				stripePaymentIntentId: session.payment_intent as string,
				metadata: {
					...((purchase.metadata as Record<string, unknown>) || {}),
					stripeSessionId: session.id,
				},
			})
			.where(eq(purchases.id, purchase.id));

		// Session expires in 24 hours
		const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

		this.logger.log('Payment link created', {
			purchaseId: purchase.id,
			userId,
			packageId,
			packageName: pkg.name,
			credits: pkg.credits,
			sessionId: session.id,
		});

		return {
			url: session.url!,
			purchaseId: purchase.id,
			expiresAt,
			package: {
				name: pkg.name,
				credits: pkg.credits,
				priceEuroCents: pkg.priceEuroCents,
			},
		};
	}
}
