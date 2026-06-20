# Análise da Estrutura — CRM Rise Hub

> Documento de diagnóstico técnico e roadmap de melhorias.
> Decisão de arquitetura: **manter o single-file (`index.html` + CDN), sem migrar para bundler/Vite.**
> O refactor é uma limpeza *interna* + correção de bugs estruturais, segurança e qualidade.
> A execução do código será feita em etapas posteriores (este documento é o plano).

---

## 1. Visão geral da arquitetura

| Aspecto | Situação |
|---|---|
| Tipo | SPA + PWA, **um único arquivo** `index.html` (411 linhas, CSS+JSX+lógica embutidos) |
| Framework | React 18.2.0 via CDN (UMD) |
| Transpilação | Babel-standalone **no navegador** (`<script type="text/babel">`) |
| Backend | Supabase (Auth + REST/PostgREST), classe `SupabaseClient` (`index.html:203-218`) |
| Estado | Context API (`AppContext`) + hooks; sessão em `localStorage` |
| Roteamento | Manual via `useState('page')` + `switch` (`index.html:383`) |
| Estilo | CSS custom properties (design system coeso), 4 breakpoints responsivos |
| Build/Deploy | Vercel roda `build.js` → gera `config.js`; `vercel.json` (cleanUrls) |
| Tooling | **Sem** `package.json`, testes, lint, TypeScript ou CI |

**Páginas:** Dashboard, Pipeline (kanban), Leads (tabela), Campanhas (UTM), Tarefas, Configurações,
mais `LeadDetailPanel` (painel lateral) e `LoginPage`.

**Tabelas Supabase:** `leads_rise_hub`, `crm_atividades`, `crm_tarefas`, `crm_users`.

---

## 2. Diagnóstico

### 🔴 Crítico

**C1 — Sistema de config multi-tenant está DESCONECTADO (bug estrutural principal).**
- `build.js` gera `config.js` com `window.RISE_CONFIG` a partir das env vars da Vercel
  (Supabase URL/key + branding: `clientName`, `clientShort`, `brandColor`, `brandColor2`, `logoUrl`, `formsUrl`).
- Mas o `index.html` **nunca carrega `config.js`** (não há `<script src="/config.js">`, ver `index.html:22-24`)
  e **nunca referencia `window.RISE_CONFIG`**. Em vez disso usa credenciais Supabase *hardcoded*
  (`index.html:191-192`) e branding fixo ("Rise Hub", logo `/icon-192.png`, `forms-rise-hub.vercel.app`).
- **Efeito:** todo deploy aponta para o **mesmo banco fixo**; as env vars da Vercel são ignoradas;
  a promessa multi-cliente do `build.js`/`config.example.js` **não funciona**.

**C2 — Sem `.gitignore`.** O `config.example.js:8` instrui a colocar `config.js` no `.gitignore`,
mas o arquivo não existe → risco de commitar `config.js`/credenciais de clientes e `node_modules/`.

**C3 — Credenciais Supabase no fonte (`index.html:191-192`).** A *anon key* é pública por design
(protegida por RLS no Supabase), então **não é catástrofe se o RLS estiver ativo**. Ação necessária:
(a) **confirmar que RLS está habilitado** em todas as tabelas; (b) mover a leitura para `RISE_CONFIG` (ver C1).
Só rotacionar a chave se RLS estiver ausente/incorreto.

### 🟠 Qualidade / Manutenibilidade

**M1 — Arquivo monolítico com linhas gigantes.** Componentes e CSS em linha única dificultam leitura e diff.

**M2 — Duplicação alta** (dentro do próprio single-file):
- Modal de criação de lead **duplicado** em `PipelinePage` (`index.html:301`) e `LeadsPage` (`index.html:314`) — campos idênticos.
- Badge de status renderizado inline em Dashboard, Leads e DetailPanel (mesma expressão `badge ${STATUS_CONFIG...}`).
- Badge de classificação HOT/WARM/COLD repetido com o mesmo ternário de cor em ≥3 lugares (Pipeline, Leads, DetailPanel).
- Estrutura `modal-overlay/content/header/body/footer` + botão de fechar (SVG inline) repetida em 3 telas.
- Lógica de busca de leads duplicada: `PipelinePage` (`:294`) e `LeadsPage` (`:311`).

**M3 — `catch(e){}` silenciosos** (`index.html:207, 211, 217`, etc.) escondem falhas de rede/sessão.

**M4 — Sem Error Boundary React** → um erro de render em qualquer página derruba o app inteiro.

### 🟡 Performance / Robustez

**P1 — React em build de desenvolvimento via CDN** (`react.development.js`, `react-dom.development.js`,
`index.html:22-23`) — deveria ser `*.production.min.js` (menor e mais rápido).

**P2 — Sem SRI** (Subresource Integrity) nem `crossorigin` nos `<script>` de CDN (`index.html:22-24`).

**P3 — Babel transpila no navegador a cada carga** — custo de runtime; inerente ao single-file.
Aceitável dada a decisão de não usar bundler; mitigável via cache do service worker.

**P4 — Sem paginação.** Leads/atividades/tarefas carregam tudo (`crm_atividades` com `limit:50` fixo, `index.html:346`);
o polling a cada 30s (`index.html:376`) recarrega a lista inteira de leads.

### ⚪ Acessibilidade

**A1** — Botões só-ícone (olho, lixeira, fechar, menu) sem `aria-label`.
**A2** — Modais sem `role="dialog"`/`aria-modal` nem foco preso (trap) ou fechar com `Esc`.
**A3** — Toasts sem `aria-live` (não anunciados por leitores de tela).
**A4** — Kanban drag-and-drop sem alternativa por teclado.
**A5** — Sem estilo `:focus-visible` global consistente.

### ✅ Pontos fortes (preservar)

- `SupabaseClient` bem encapsulado, com refresh de sessão (`index.html:203-218`).
- Design system coeso por CSS variables; PWA configurada (manifest + service worker network-first).
- `build.js` simples e com validação — só precisa ser **ligado** ao front.
- Responsividade cuidadosa (breakpoints 1200/900/600/400, safe-area insets).

---

## 3. Roadmap de Refactor (mantendo single-file + CDN)

Ordenado por impacto/risco. Cada fase é commitável de forma independente.

### Fase 1 — Correções críticas (alto impacto, baixo risco)
- **Ligar o `config.js` ao front:**
  - Adicionar `<script src="/config.js"></script>` no `<head>` (após os scripts de CDN, antes do `type="text/babel"`).
  - Definir no topo do app: `const CFG = window.RISE_CONFIG || {};` e ler `supabaseUrl`/`supabaseAnonKey` dele
    em vez das constantes hardcoded (`index.html:191-192`).
  - **Branding dinâmico** a partir de `CFG`: `document.title`, logo (sidebar/login → `CFG.logoUrl`),
    nome (`CFG.clientName`/`clientShort`), `FORMS_URL` na ConfigPage (`index.html:358`), e injetar
    `brandColor`/`brandColor2` em `--accent`/`--pink` via `document.documentElement.style.setProperty(...)`.
  - **Fallback** amigável: se faltar `supabaseUrl`/`anonKey`, renderizar tela de erro em `#root` em vez de quebrar.
- **Criar `.gitignore`** com `config.js`, `.env*`, `node_modules/`.
- **Dev local:** documentar `cp config.example.js config.js` (agora gitignored).
- **Verificar RLS** das 4 tabelas via MCP Supabase; reportar e recomendar rotação da anon key só se necessário.

### Fase 2 — Dedup e componentização interna (no mesmo `<script>`)
- `Modal({title,onClose,footer,children})` — substitui as 3 cópias de overlay/modal + botão fechar.
- `LeadFormModal(...)` — unifica o formulário de lead de Pipeline e Leads.
- `StatusBadge({status})` (usa `STATUS_CONFIG`) e `LeadScoreBadge({classification,score})`.
- Utilitário central de cores de classificação (`HOT/WARM/COLD`) — remove ternários repetidos.
- Helper `matchLeadSearch(lead,q)` reutilizado por Pipeline e Leads; hook `useDashboardMetrics(leads)`
  agrupando os ~8 `useMemo` do Dashboard (`index.html:257-265`).

### Fase 3 — Robustez e erros
- Substituir `catch(e){}` silenciosos por `console.error` + toast quando fizer sentido.
- Adicionar **ErrorBoundary** (componente classe) envolvendo `<App/>` no render.
- Evitar toast repetido a cada falha do polling de 30s (mostrar erro uma vez / backoff simples).

### Fase 4 — Performance / Hardening de CDN
- Trocar para `react.production.min.js` / `react-dom.production.min.js`.
- Adicionar `integrity` (SRI) + `crossorigin="anonymous"` nos `<script>` de CDN.
- (Opcional) revisar o service worker para cachear os assets de CDN (offline real).

### Fase 5 — Acessibilidade
- `aria-label` nos botões só-ícone; `role="dialog"`/`aria-modal` + foco preso + `Esc` nos modais;
  `aria-live="polite"` no `ToastContainer`; `:focus-visible` global.

### Fase 6 — Qualidade de processo (leve, sem mexer no single-file)
- GitHub Actions mínimo: validar que `node build.js` roda com env vars de teste + lint de HTML básico.
- `README.md` documentando arquitetura single-file, fluxo `build.js → config.js` e dev local.

---

## 4. Arquivos afetados

| Arquivo | Fase | Observação |
|---|---|---|
| `index.html` | 1–5 | Núcleo: config wiring, branding, dedup, ErrorBoundary, a11y, CDN |
| `.gitignore` | 1 | Novo |
| `build.js` | 1 | Revisar defaults de branding; provável sem mudança |
| `.github/workflows/ci.yml` | 6 | Novo (opcional) |
| `README.md` | 6 | Novo |

---

## 5. Verificação (end-to-end)

1. **Config wiring:** `cp config.example.js config.js` com credenciais de teste, abrir `index.html`,
   confirmar login + branding (nome/cor/logo) refletindo o `config.js`. Remover `config.js` → confirmar fallback.
2. **Build Vercel:** `node build.js` com env vars setadas → confirmar `config.js` correto.
3. **RLS:** via MCP Supabase, listar policies das tabelas e confirmar que a anon key não dá acesso indevido.
4. **Dedup:** confirmar que Pipeline e Leads usam o mesmo `LeadFormModal` e que criar lead funciona em ambas.
5. **A11y:** navegação por teclado nos modais (Tab/Esc) e leitura dos toasts por leitor de tela.
6. **Regressão:** smoke test das 6 páginas (Dashboard, Pipeline, Leads, Campanhas, Tarefas, Config).
