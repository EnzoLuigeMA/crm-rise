// ============================================================
// build.js — Gera o config.js a partir das variáveis de ambiente
// ============================================================
// A Vercel roda este script no deploy. Cada projeto Vercel tem
// suas próprias env vars, então cada deploy gera um config.js
// apontando pro banco do cliente certo.
//
// Não precisa mexer neste arquivo nunca. Ele é igual pra todos.
// ============================================================

const fs = require('fs');

const config = {
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  clientName: process.env.CLIENT_NAME || 'Rise Hub',
  clientShort: process.env.CLIENT_SHORT || 'Rise CRM',
  brandColor: process.env.BRAND_COLOR || '#9b59b6',
  brandColor2: process.env.BRAND_COLOR2 || '#e74c8b',
  logoUrl: process.env.LOGO_URL || '/icon-192.png',
  formsUrl: process.env.FORMS_URL || ''
};

// Validação básica — falha o build se faltar o essencial
if (!config.supabaseUrl || !config.supabaseAnonKey) {
  console.error('❌ ERRO: SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias.');
  console.error('Configure as variáveis de ambiente no projeto Vercel.');
  process.exit(1);
}

const content = `// Gerado automaticamente no deploy — não editar à mão
window.RISE_CONFIG = ${JSON.stringify(config, null, 2)};
`;

fs.writeFileSync('config.js', content);
console.log('✅ config.js gerado para: ' + config.clientName);
console.log('   Supabase: ' + config.supabaseUrl);
