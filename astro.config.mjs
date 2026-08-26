import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Atlas do Generalista',
      customCss: [],
      // Injeta o script do Netlify Identity no head de todas as páginas
      head: [
        {
          tag: 'script',
          attrs: {
            src: 'https://identity.netlify.com/v1/netlify-identity-widget.js',
          },
        },
      ],
      sidebar: [
        {
          label: 'Livro 1: Raciocínio Clínico',
          autogenerate: { directory: 'livro1' },
        },
      ],
    }),
  ],
});
