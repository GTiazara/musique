import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { morceauSchema } from './lib/morceau-schema';

const morceaux = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/morceaux' }),
  schema: morceauSchema,
});

export const collections = { morceaux };
