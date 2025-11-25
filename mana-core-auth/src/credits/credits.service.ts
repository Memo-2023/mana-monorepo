import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, and, sql, desc } from 'drizzle-orm';
import { getDb } from '../db/connection';
import { balances, transactions, purchases, packages, usageStats } from '../db/schema';
import { UseCreditsDto } from './dto/use-credits.dto';

@Injectable()
export class CreditsService {
  constructor(private configService: ConfigService) {}

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

    const [balance] = await db
      .select()
      .from(balances)
      .where(eq(balances.userId, userId))
      .limit(1);

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
      let freeCreditsUsed = Math.min(useCreditsDto.amount, currentBalance.freeCreditsRemaining);
      let paidCreditsUsed = useCreditsDto.amount - freeCreditsUsed;

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

  async getTransactionHistory(userId: string, limit: number = 50, offset: number = 0) {
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

    const [balance] = await db
      .select()
      .from(balances)
      .where(eq(balances.userId, userId))
      .limit(1);

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
}
