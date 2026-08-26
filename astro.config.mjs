// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'Atlas do Generalista',
			sidebar: [
				{
					label: 'Início',
					items: [
						{ label: 'Introdução', slug: 'guides/example' },
					],
				},
			],
		}),
	],
});

import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Atlas do Generalista',
      // Injeta o script do Netlify Identity no head de todas as páginas
      customCss: [],
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
        // Adicione os outros livros aqui depois
      ],
    }),
  ],
});
