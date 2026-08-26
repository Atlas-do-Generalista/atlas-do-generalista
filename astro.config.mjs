import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Atlas do Generalista: Manual Aberto de Medicina para o Generalista',
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
          label: 'Livro I: Raciocínio Clínico e Tomada de Decisão',
          items: [
            { autogenerate: { directory: 'livro1' } },
          ],
        },
        {
          label: 'Livro II: Procedimentos Médicos, Habilidades Invasivas & Trauma',
          items: [
            { autogenerate: { directory: 'livro2' } },
          ],
        },
        {
          label: 'Livro III: Oncologia Prática, Emergências Oncológicas & Paliativismo',
          items: [
            { autogenerate: { directory: 'livro3' } },
          ],
        },
        {
          label: 'Livro IV: Pediatria e Emergências Pediátricas para o Generalista',
          items: [
            { autogenerate: { directory: 'livro4' } },
          ],
        },
        {
          label: 'Livro V: Ginecologia, Obstetrícia & Urgências Gineco-Obstétricas',
          items: [
            { autogenerate: { directory: 'livro5' } },
          ],
        },
        {
          label: 'Livro VI: Toxicologia Clínica e Envenenamentos',
          items: [
            { autogenerate: { directory: 'livro6' } },
          ],
        },
        {
          label: 'Livro VII: Medicina Legal, Atestados, Documentação & Deontologia',
          items: [
            { autogenerate: { directory: 'livro7' } },
          ],
        },
        {
          label: 'Livro VIII: Gestão do Plantão, Carreira, Prescrição & Ferramentas de Suporte',
          items: [
            { autogenerate: { directory: 'livro8' } },
          ],
        },
      ],
    }),
  ],
});
