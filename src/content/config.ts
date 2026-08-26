import { defineCollection, z } from 'astro:content';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
	docs: defineCollection({
		schema: docsSchema({
			extend: z.object({
				autor: z.string().optional(),
				orcid: z.string().optional(),
				revisor: z.string().optional(),
				date: z.date().optional(),
				doi: z.string().optional(),
			}),
		}),
	}),
};
