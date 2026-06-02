const fs = require('fs');
const path = require('path');

// Carrega .env local se existir (opcional, para desenvolvimento)
try { require('dotenv').config(); } catch {}

const env = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
  TMDB_KEY: process.env.TMDB_API_KEY || '',
};

const content = `// Auto-gerado por scripts/build-env.js — não editar manualmente
window.ENV = ${JSON.stringify(env, null, 2)};
`;

const out = path.join(__dirname, '..', 'js', 'env.js');
fs.writeFileSync(out, content, 'utf8');
console.log('✓ js/env.js gerado com sucesso');
