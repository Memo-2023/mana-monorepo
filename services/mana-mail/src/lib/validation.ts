/**
 * Zod validation schemas for request bodies.
 */

import { z } from 'zod';

export const sendEmailSchema = z.object({
	to: z.array(z.object({ email: z.string().email(), name: z.string().optional() })).min(1),
	cc: z.array(z.object({ email: z.string().email(), name: z.string().optional() })).optional(),
	bcc: z.array(z.object({ email: z.string().email(), name: z.string().optional() })).optional(),
	subject: z.string().min(1),
	body: z.string().min(1),
	htmlBody: z.string().optional(),
	inReplyTo: z.string().optional(),
	references: z.array(z.string()).optional(),
});

export const saveDraftSchema = z.object({
	to: z.array(z.object({ email: z.string().email(), name: z.string().optional() })).optional(),
	cc: z.array(z.object({ email: z.string().email(), name: z.string().optional() })).optional(),
	subject: z.string().optional(),
	body: z.string().optional(),
	htmlBody: z.string().optional(),
	inReplyTo: z.string().optional(),
});

export const updateMessageSchema = z.object({
	isRead: z.boolean().optional(),
	isFlagged: z.boolean().optional(),
	mailboxIds: z.record(z.boolean()).optional(),
});

export const updateAccountSchema = z.object({
	displayName: z.string().optional(),
	signature: z.string().optional(),
});

export const onUserCreatedSchema = z.object({
	userId: z.string().min(1),
	email: z.string().email(),
	name: z.string().optional(),
});
