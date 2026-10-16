// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // GitHub Pages (project site): https://leonel1524.github.io/adviento-calendar/
  site: 'https://leonel1524.github.io',
  base: '/adviento-calendar',
  vite: {
    plugins: [tailwindcss()]
  }
});