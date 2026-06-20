#!/usr/bin/env node
// ============================================================
// check-jsx.js — valida a sintaxe do JSX embutido no index.html
// ============================================================
// Extrai o bloco <script type="text/babel"> e roda o esbuild
// (via npx) para garantir que não há erro de sintaxe/JSX.
// Não precisa de credenciais nem de instalar dependências.
// ============================================================

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const match = html.match(/<script type="text\/babel">([\s\S]*?)<\/script>/);
if (!match) {
  console.error('❌ Não encontrei o bloco <script type="text/babel"> no index.html');
  process.exit(1);
}

const tmp = path.join(os.tmpdir(), 'crm-rise-app.jsx');
fs.writeFileSync(tmp, match[1]);

const res = spawnSync(
  'npx',
  ['--yes', 'esbuild@0.21.5', tmp, '--outfile=' + path.join(os.tmpdir(), 'crm-rise-out.js')],
  { stdio: 'inherit' }
);

if (res.status === 0) {
  console.log('✅ JSX válido (sem erros de sintaxe).');
}
process.exit(res.status === null ? 1 : res.status);
