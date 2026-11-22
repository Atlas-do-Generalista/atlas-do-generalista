#!/usr/bin/env node
// Adaptador de compatibilidade para Node 22 no ambiente local
process.versions.webcontainer = '1';
import('./node_modules/astro/bin/astro.mjs');
