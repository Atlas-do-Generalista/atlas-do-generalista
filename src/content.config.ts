import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        autores: z.array(
          z.object({
            nome: z.string(),
            orcid: z.string().optional(),
          })
        ).optional(),

        revisor: z.string().optional(),
        date: z.coerce.date().optional(),
        doi: z.string().optional(),
      }),
    }),
  }),
};
