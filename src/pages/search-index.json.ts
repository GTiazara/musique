import { getCollection } from 'astro:content';
import { searchDocuments } from '../lib/morceaux';

/**
 * Index JSON des morceaux publiés, écrit au build.
 * Le navigateur l'utilise pour la recherche. Les brouillons n'y figurent pas.
 */
export const GET = async () => {
  const documents = searchDocuments(await getCollection('morceaux'), import.meta.env.BASE_URL);
  return new Response(JSON.stringify(documents), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
