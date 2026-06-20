# CRM Rise Hub

CRM single-file (um único `index.html`) em React 18 via CDN + Babel no navegador,
com backend **Supabase** (Auth + REST). PWA instalável, deploy na **Vercel**.

> Arquitetura proposital: **sem bundler/build step de JS**. Tudo vive em `index.html`
> e é transpilado pelo Babel-standalone no browser. Não há `package.json`.

## Como funciona o config (multi-cliente)

As credenciais e o branding **não ficam hardcoded** — vêm de `window.RISE_CONFIG`,
definido no arquivo `config.js`:

- **Produção (Vercel):** `build.js` roda no deploy e gera o `config.js` a partir das
  variáveis de ambiente do projeto (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `CLIENT_NAME`,
  `CLIENT_SHORT`, `BRAND_COLOR`, `BRAND_COLOR2`, `LOGO_URL`, `FORMS_URL`).
- **Desenvolvimento local:** copie o exemplo e preencha:

  ```bash
  cp config.example.js config.js
  # edite config.js com a URL e a anon key do seu Supabase
  ```

  Depois é só abrir o `index.html` no navegador.

> `config.js` está no `.gitignore` — **nunca** commite credenciais de cliente.
> Se `RISE_CONFIG` não tiver as credenciais, o app mostra uma tela "Configuração ausente".

## Estrutura

| Arquivo | Papel |
|---|---|
| `index.html` | App inteiro (UI + lógica + CSS) |
| `build.js` | Gera `config.js` a partir das env vars (roda na Vercel) |
| `config.example.js` | Template do `config.js` para dev local |
| `vercel.json` | Config de deploy (build + cleanUrls) |
| `manifest.json` + ícones | PWA |

## Dados / Supabase

Tabelas: `leads_rise_hub`, `crm_atividades`, `crm_tarefas`, `crm_users`.
Os leads chegam pelo formulário externo (UTMs capturados na URL) e são gravados no Supabase;
o CRM apenas lê/atualiza. **A lógica de dados e os nomes de campos não devem ser alterados**
para não quebrar a integração com o formulário.

## Verificação rápida

```bash
# valida a sintaxe do JSX embutido no index.html
node tools/check-jsx.js
```

Veja `ANALISE-ESTRUTURA.md` para o diagnóstico técnico e o roadmap de melhorias.
