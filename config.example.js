// ============================================================
// config.js — EXEMPLO para desenvolvimento local
// ============================================================
// Em produção, este arquivo é GERADO automaticamente pelo
// build.js a partir das env vars da Vercel. Este exemplo serve
// só pra testar localmente (abrir o index.html no navegador).
//
// IMPORTANTE: adicione "config.js" no .gitignore pra não
// commitar credenciais. O build.js recria ele no deploy.
// ============================================================

window.RISE_CONFIG = {
  // Banco de dados (Supabase do cliente)
  supabaseUrl: 'https://SEU-PROJETO.supabase.co',
  supabaseAnonKey: 'SUA_CHAVE_ANON_AQUI',

  // Branding
  clientName: 'Rise Hub',
  clientShort: 'Rise CRM',
  brandColor: '#9b59b6',
  brandColor2: '#e74c8b',
  logoUrl: '/icon-192.png',

  // Opcional
  formsUrl: 'https://forms-rise-hub.vercel.app'
};
