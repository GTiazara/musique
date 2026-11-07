import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import tailwindcss from '@tailwindcss/vite';
import { unified } from '@astrojs/markdown-remark';
import { remarkGrille } from './src/lib/remark-grille';

/**
 * Site statique. En local, `base` vaut `/`.
 * En CI, GitHub Actions fournit l'URL et le sous-dossier du dépôt.
 */
export default defineConfig({
  output: 'static',
  site: process.env.SITE_URL || undefined,
  base: process.env.SITE_BASE || '/',
  integrations: [vue()],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    processor: unified({ remarkPlugins: [remarkGrille] }),
  },
});
