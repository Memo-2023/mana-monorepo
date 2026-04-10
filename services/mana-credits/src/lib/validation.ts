/**
 * Zod schemas for request body validation.
 */

import { z } from 'zod';

// ─── Credits ────────────────────────────────────────────────

export const useCreditsSchema = z.object({
	amount: z.number().positive(),
	appId: z.string().min(1),
	description: z.string().min(1),
	idempotencyKey: z.string().optional(),
	metadata: z.record(z.unknown()).optional(),
});

export const purchaseCreditsSchema = z.object({
	packageId: z.string().uuid(),
});

export const createPaymentLinkSchema = z.object({
	packageId: z.string().uuid(),
	quantity: z.number().int().positive().default(1),
});

// ─── Gifts ──────────────────────────────────────────────────

export const createGiftSchema = z.object({
	totalCredits: z.number().int().positive().min(1).max(10000),
	type: z.enum(['simple', 'personalized']).default('simple'),
	targetEmail: z.string().email().optional(),
	message: z.string().max(500).optional(),
	expirationDays: z.number().int().positive().optional(),
});

export const redeemGiftSchema = z.object({
	sourceAppId: z.string().optional(),
});

// ─── Internal (Service-to-Service) ──────────────────────────

export const internalUseCreditsSchema = z.object({
	userId: z.string().min(1),
	amount: z.number().positive(),
	appId: z.string().min(1),
	description: z.string().min(1),
	idempotencyKey: z.string().optional(),
	metadata: z.record(z.unknown()).optional(),
});

export const internalRefundSchema = z.object({
	userId: z.string().min(1),
	amount: z.number().positive(),
	description: z.string().min(1),
	appId: z.string().default('system'),
	metadata: z.record(z.unknown()).optional(),
});

export const internalInitSchema = z.object({
	userId: z.string().min(1),
});

export const internalRedeemPendingSchema = z.object({
	userId: z.string().min(1),
	email: z.string().email(),
});
