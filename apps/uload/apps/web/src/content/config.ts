import { z } from 'zod';

// Author Schema
export const authorSchema = z.object({
	id: z.string(),
	name: z.string(),
	bio: z.string().optional(),
	avatar: z.string().optional(),
	social: z.object({
		twitter: z.string().optional(),
		github: z.string().optional(),
		linkedin: z.string().optional(),
		website: z.string().optional()
	}).optional()
});

// Blog Post Schema
export const blogSchema = z.object({
	title: z.string(),
	excerpt: z.string(),
	date: z.string().or(z.date()).transform(val => new Date(val)),
	author: z.string(), // Author ID
	tags: z.array(z.string()).default([]),
	category: z.enum(['tutorial', 'psychology', 'feature', 'announcement', 'case-study']),
	image: z.string().optional(),
	draft: z.boolean().default(false),
	featured: z.boolean().default(false),
	series: z.string().optional(),
	layout: z.string().default('blog'),
	seo: z.object({
		title: z.string().optional(),
		description: z.string().optional(),
		canonical: z.string().optional()
	}).optional()
});

// Type exports
export type BlogPost = z.infer<typeof blogSchema>;
export type Author = z.infer<typeof authorSchema>;

// Extended types with computed fields
export interface BlogPostWithMeta extends BlogPost {
	slug: string;
	readingTime: number;
	path?: string;
}

export interface BlogCategory {
	name: string;
	slug: string;
	count: number;
}

export interface BlogTag {
	name: string;
	count: number;
}