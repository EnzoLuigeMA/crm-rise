# CRM Rise Hub

CRM single-file (um único `index.html`) em React 18 via CDN + Babel no navegador,
com backend **Supabase** (Auth + REST). PWA instalável, deploy estático na **Vercel**.

> Arquitetura proposital: **sem bundler e sem build step**. Tudo vive em `index.html`
> e é transpilado pelo Babel-standalone no browser. Não há `package.json` nem variáveis
> de ambiente — as credenciais do Supabase da Rise ficam no próprio `index.html`.

## Configuração

As credenciais e o branding ficam **fixos no topo do `index.html`** (constantes
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `CLIENT_NAME`, etc.). A anon key é pública por
design — o acesso é protegido pelo **RLS** no Supabase.

> Para apontar para outro banco, basta editar essas constantes no `index.html`.

## Estrutura

| Arquivo | Papel |
|---|---|
| `index.html` | App inteiro (UI + lógica + CSS) |
| `vercel.json` | Deploy estático (cleanUrls) |
| `manifest.json` + ícones | PWA |
| `tools/check-jsx.js` | Valida a sintaxe do JSX embutido |

## Dados / Supabase

Tabelas: `leads_rise_hub`, `crm_atividades`, `crm_tarefas`, `crm_users`.
Os leads chegam pelo formulário externo (UTMs capturados na URL) e são gravados no Supabase;
o CRM apenas lê/atualiza. **A lógica de dados e os nomes de campos não devem ser alterados**
para não quebrar a integração com o formulário.

## Desenvolvimento local

É só abrir o `index.html` no navegador (ou servir a pasta com qualquer servidor estático).

## Verificação

```bash
node tools/check-jsx.js   # valida a sintaxe do JSX embutido no index.html
```

Veja `ANALISE-ESTRUTURA.md` para o diagnóstico técnico e o roadmap de melhorias.
