import { z } from 'astro/zod';
import { categorySlugs, difficulties, statuses } from '../data/categories';

const fretValue = z.union([z.number().int().min(0).max(24), z.literal('x')]);

/**
 * Position de doigts écrite dans le morceau.
 * Six cases, du mi grave au mi aigu. La barre est facultative.
 */
export const shapeSchema = z.object({
  name: z.string().trim().min(1),
  frets: z.array(fretValue).length(6),
  fingers: z.array(z.number().int().min(0).max(4)).length(6).optional(),
  barre: z
    .object({
      fret: z.number().int().min(1).max(24),
      from: z.number().int().min(1).max(6),
      to: z.number().int().min(1).max(6),
      finger: z.number().int().min(1).max(4).optional(),
    })
    .optional(),
});

const httpUrl = z.string().url();

/** Schéma d'un morceau. Un fichier invalide fait échouer le build. */
export const morceauSchema = z.object({
  title: z.string().trim().min(1),
  artist: z.string().trim().min(1),
  description: z.string().trim().min(1),
  category: z.enum(categorySlugs),
  difficulty: z.enum(difficulties),
  status: z.enum(statuses).default('a-apprendre'),
  capo: z.number().int().min(0).max(12).default(0),
  capoNote: z.string().trim().optional(),
  key: z.string().trim().optional(),
  tags: z.array(z.string()).default([]),
  publishedAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  draft: z.boolean().default(false),
  youtube: httpUrl.optional(),
  tutorial: httpUrl.optional(),
  sheet: httpUrl.optional(),
  shapes: z.array(shapeSchema).default([]),
});

export type MorceauData = z.infer<typeof morceauSchema>;
export type ShapeData = z.infer<typeof shapeSchema>;
