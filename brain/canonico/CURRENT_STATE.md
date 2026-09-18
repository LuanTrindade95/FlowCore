---
updated: 2026-09-18
owner: LuanTrindade95
status: canonico
---

# Current State

## Resumo

FlowCore e uma plataforma de automacao de processos empresariais configuraveis. Empresas usam o sistema para criar e executar fluxos de solicitacao, aprovacao e operacoes internas sem alterar codigo.

## Estado Atual

O projeto esta com a fundacao tecnica, a modelagem de dominio/dados, autenticacao/RBAC, API de definicoes, engine backend de workflow, fundacao frontend autenticada, builder visual/form builder, experiencia runtime, automacoes realtime de SLA, polish de vitrine, staging documentado e deployment readiness implementados e validados localmente.

Existe no repositorio:

- `README.md` com stack, estrutura, comandos e regras iniciais.
- `LICENSE` MIT.
- `.gitattributes`.
- Dev Brain inicial em `brain/`.
- Fluxo de tres agentes para Claude Code: `CLAUDE.md` na raiz define a sessao principal como Interlocutor (leitura do brain, observacao de contexto, encerramento); subagentes `.claude/agents/executor.md` (aplica correcao com evidencia por passo) e `.claude/agents/auditor.md` (auditoria adversarial somente leitura, veredito APROVADO/REPROVADO).
- Documentos formais iniciais em `docs/`:
  - `docs/VISION.md`
  - `docs/DECISIONS.md`
  - `docs/PROGRESS.md`
  - `docs/ARCHITECTURE.md`
  - `docs/STAGING_PLAN.md`
  - `docs/DEPLOYMENT_READINESS.md`
  - `docs/DEMO_E2E_SCRIPT.md`
  - evidencias visuais versionadas em `docs/assets/screenshots/`
- Templates e checklists de deploy sem segredos em `deploy/`.
- Backend Laravel 12 em `backend/`.
- Frontend Angular 19 standalone em `frontend/`.
- Infra local com Docker Compose, MySQL 8, Redis 7, Horizon, Reverb e frontend.
- CI em `.github/workflows/ci.yml` verde no `main` desde `f78be75` (2026-09-18): jobs backend (pint + pest) e frontend (lint, test, typecheck, build).
- Dominio Laravel da Fase 2:
  - tabelas Definition: `workflow_definitions`, `workflow_steps`, `step_approvers`, `workflow_transitions`, `form_fields`
  - tabelas Runtime: `workflow_instances`, `instance_steps`, `instance_step_decisions`, `workflow_actions`
  - enums, models, relationships, casts e state machines fixas
  - RBAC seed com `admin`, `approver`, `requester`
  - dados demo com 2 workflows publicados e 10 instancias variadas
- Backend Auth/RBAC da Fase 3A:
  - `/api/v1/auth/login`
  - `/api/v1/auth/logout`
  - `/api/v1/auth/me`
  - middleware de permissao Spatie registrado
  - policies base para definitions, instances e decisions
  - formato JSON padrao para erros de API
- Backend Workflow Definition API da Fase 3B:
  - CRUD de `/api/v1/workflows`
  - sub-recursos de steps, transitions, step approvers e form fields
  - leitura completa da definicao com grafo e schema de formulario
  - `GraphValidator` no publish
  - definicoes publicadas imutaveis
  - `POST /api/v1/workflows/{id}/draft` para nova versao draft
- Backend Workflow Engine da Fase 3C:
  - `WorkflowEngine` com `start`, `decide`, `advance`, `reassign` e `comment`
  - `ConditionEvaluator` com sandbox baseado apenas em dados da instancia
  - `AssigneeResolver` para user, role e dinamico `requester_manager`
  - endpoints `/api/v1/inbox`, `/api/v1/requests` e actions de steps
  - suporte a approval modes `any`, `all` e `quorum`
  - rejeicao roteada por transition `rejected` quando existir, ou terminal `rejected` quando nao existir
  - transacao e `lockForUpdate` em decisoes para proteger quorum contra concorrencia
- Frontend Fundacao da Fase 4A:
  - Angular standalone com rotas lazy por feature
  - AuthService com Signals e token somente em memoria
  - interceptors de auth, loading e erro JSON
  - guards funcionais de autenticacao e permissao
  - UI kit base: button, input/select, card, status pill, modal, toast, data table, timeline, empty state e skeleton
  - shell SaaS light-enterprise com sidebar desktop e bottom nav mobile
  - tela `/login` com reactive form, validacao, loading e erro
  - Playwright dev dependency para smoke visual local
- Frontend Builder Visual + Form Builder da Fase 4B:
  - rotas `/admin/workflows`, `/admin/workflows/:id/builder` e `/admin/workflows/:id/form`
  - lista de workflows com status, versao, clone explicito de publicado para draft e redirecionamento legado de `/workflows`
  - canvas visual com `@foblex/flow`, nodes, connections e painel lateral de configuracao
  - persistencia de steps, approvers, transitions e form fields via APIs da Fase 3B
  - publish usando o backend como autoridade, exibindo `errors.graph` 422 e destacando problemas por node/transition
  - form builder com reorder persistido e preview de campos
- Backend Runtime Experience da Fase 4C:
  - catalogo das versoes publicadas mais recentes e schema de formulario normalizado
  - escopo de visibilidade de instancias aplicado no backend
  - lista com filtros de status, workflow, ownership e periodo
  - detalhe, inbox, assignees e dashboard com recursos enriquecidos e flags de acao
  - validacao runtime de campos obrigatorios, tipos, datas, booleanos, selects e chaves desconhecidas
- Frontend Runtime da Fase 4C:
  - rotas `/requests`, `/requests/new`, `/requests/:id`, `/inbox` e `/dashboard`
  - formulario reativo gerado pelo schema publicado, incluindo erros 422 do backend
  - filtros de solicitacoes persistidos em query parameters
  - detalhe com dados enviados e linha do tempo de auditoria
  - inbox com progresso any/all/quorum e acoes condicionadas pelas flags da API
  - dashboard com pendencias, atrasos, instancias ativas, throughput e volume por workflow
  - E2E local validou solicitacao `#72`, aprovacao do gestor e avanco para aprovacao financeira
- Fase 5 - Escalonamento, Automacoes + Realtime:
  - `workflow:escalate-overdue` agendado a cada minuto em `routes/console.php`
  - `WorkflowEscalationService` com lock pessimista, revalidacao e idempotencia de escalonamento
  - `RuntimeWorkflowUpdated` em canais privados `users.{id}.runtime`
  - `/api/broadcasting/auth` com Sanctum e JSON `auth` para clientes Reverb/Echo
  - `RuntimeEventDispatcher` calculando solicitante, admins, assignee aberto e aprovadores resolvidos
  - frontend com `RuntimeRealtimeService` e refresh automatico de inbox, detalhe e dashboard
  - E2E local validou request `#77` mudando de `Pendente` para `Escalada` sem reload manual
- Fase 6 - Polish & Vitrine:
  - README principal reescrito como material de avaliacao tecnica do portfolio
  - `docs/ARCHITECTURE.md` documentando camadas, dominio, realtime, seed, seguranca e trade-offs
  - seed demo deterministica e idempotente para usuarios, workflows, steps, approvers, campos, transitions e instancias runtime seedadas
  - teste `DemoSeederTest` garantindo estabilidade do dataset demo em execucoes repetidas
  - tela de login alinhada ao posicionamento de demo tecnica
  - E2E local validou login, dashboard, workflows publicados e login mobile sem overflow
- Fase 7 - Staging Documentado + Evidencias:
  - branch `feature/deploy-staging-evidence` criada a partir de `feature/root-gates`
  - `docs/STAGING_PLAN.md` documenta Netlify, Render e Aiven como candidatos sem provisionamento externo
  - `docs/DEMO_E2E_SCRIPT.md` formaliza o roteiro local resetavel para avaliacao tecnica
  - screenshots desktop versionados para login, dashboard e workflows publicados
  - README, decisoes e progresso atualizados com o status de staging documentado
  - validacao completa executada com root gates, seed Docker, Playwright e godmode verify
- Fase 8 - Deployment Readiness:
  - branch `feature/deployment-readiness` criada a partir de `feature/deploy-staging-evidence`
  - frontend carrega `/config.json` antes do bootstrap Angular
  - defaults locais continuam disponiveis para Docker/dev
  - fora de localhost, ausencia de `/config.json` falha fechado
  - `frontend/scripts/write-runtime-config.mjs` gera config por variaveis `FLOWCORE_*`
  - `netlify.toml` prepara build estatico da SPA com rewrite Angular
  - backend expoe `/health` para checks de plataforma
  - `deploy/render/render.yaml.example` documenta Render sem ativar Blueprint real
  - `deploy/aiven/free-tier-checklist.md` documenta MySQL/Valkey sem criar servicos
  - exemplos de env de staging vivem em `docs/env/`
- Fase 9 - Platform Approval + External Smoke:
  - PO aprovou seguir com recursos externos em free tier
  - Render Blueprint real `render.yaml` foi materializado e validado
  - Aiven criou `flowcore-valkey` em free tier
  - Aiven bloqueou segundo MySQL free por limite da organizacao; FlowCore usa banco `flowcore_staging` e usuario `flowcore_app` isolados no servico MySQL existente `portfolio`
  - Netlify permanece pendente ate existirem URLs publicas de API/Reverb

Ainda nao existe:

- Fluxos completos do produto fora do roadmap faseado.
- Backlog tecnico.
- Deploy publico/staging real aplicado no Render/Netlify.

## Contexto Confirmado

- Stack principal decidida: Angular 19, Laravel 12, MySQL, Redis e Docker.
- Arquitetura conceitual baseada em Workflow Engine configuravel.
- O sistema nao tera fluxos fixos; administradores poderao configurar etapas, aprovacoes, condicoes e transicoes pela interface.
- O projeto deve demonstrar senioridade arquitetural por meio de State Machine, Event Driven Architecture, filas, scheduler, auditoria e modelagem de dominio.
- Documentacao oficial vive em Markdown versionado no Git.
- Obsidian tambem sera usado para aprendizado, conceitos, ADRs, arquitetura, duvidas, evolucao tecnica, comparacoes entre projetos e preparacao para entrevistas.
- `docs/VISION.md` define o escopo MVP, a separacao Definition vs Runtime, o mapa de telas, riscos tecnicos e o brand kit light-first.
- O pacote externo `03-flowcore-prompts.md` esta sendo usado como roadmap operacional faseado, com auditoria a cada fase.
- A Fase 1 criou a fundacao sem entidades de dominio, mantendo `Definition` e `Runtime` para a Fase 2.
- Docker Compose e CI sao as referencias de execucao para PHP 8.3, MySQL e Redis.
- A Fase 2 separou Definition e Runtime em schema proprio; instancias guardam `definition_version`.
- State machines de instancia e step sao fixas em codigo; o grafo continua sendo dado para a engine futura.
- A Fase 3A usa Sanctum Bearer token para API; armazenamento do token no frontend sera decidido na Fase 4A.
- A Fase 3B definiu que drafts podem ser incompletos, mas publicacao valida grafo e condicoes por parse.
- A Fase 3B definiu que editar publicado diretamente retorna 422; nova versao exige endpoint explicito de draft.
- A Fase 3C definiu que a engine executa apenas definicoes publicadas e fixa `definition_version` na abertura.
- A Fase 3C definiu que expressoes condicionais avaliam somente variaveis de `workflow_instances.data`.
- A Fase 3C definiu que decisoes concorrentes sao serializadas por transacao e lock pessimista no step.
- A Fase 4A definiu token frontend somente em memoria, sem `localStorage`.
- A Fase 4A definiu Signals como estrategia de estado frontend, sem NgRx.
- A Fase 4A adicionou Playwright para smoke visual local de login/shell.
- A Fase 4B definiu que o canvas Foblex e superficie visual; o estado de dominio e serializacao continuam na feature Angular e na API Laravel.
- A Fase 4B definiu que validacao de grafo para publicacao vem do backend, com UI apenas renderizando `errors.graph` e highlights.
- A Fase 4C definiu que o schema publicado dirige o formulario runtime, mas a engine sempre revalida o payload.
- A Fase 4C definiu que visibilidade e flags de acao sao autoridade do backend, nao da navegacao Angular.
- A Fase 4C definiu query parameters como fonte de verdade dos filtros da lista de solicitacoes.
- A Fase 5 definiu canais privados por usuario como fronteira de realtime runtime.
- A Fase 5 definiu `/api/broadcasting/auth` como endpoint JSON de autorizacao Reverb para a SPA.
- A Fase 5 definiu `ShouldBroadcastNow` para eventos pequenos de refresh operacional.
- A Fase 5 definiu escalonamento de SLA idempotente por comando agendado com lock pessimista.
- A Fase 6 definiu seed demo deterministica como base de vitrine reproduzivel.
- A Fase 6 definiu que apenas instancias com marcador `payload.seeded=true` em `workflow_actions` podem ser removidas/recriadas pela seed demo.
- A Fase 7 definiu que o staging oficial neste momento e documentado/local, sem criar recursos externos ate aprovacao especifica por plataforma.
- A Fase 7 definiu que Netlify, Render e Aiven sao candidatos de deploy futuro, com preferencia por free tier/local e banco demo resetavel.
- A Fase 7 definiu que poucas imagens selecionadas devem ser versionadas como evidencia de portfolio, nao um acervo completo de screenshots.
- A Fase 8 definiu `/config.json` como contrato runtime do frontend para API e Reverb.
- A Fase 8 definiu falha fechada fora de localhost quando a config runtime nao puder ser carregada.
- A Fase 8 definiu que templates Render/Aiven permanecem documentais ate Gate PO especifico.
- A Fase 9 definiu que o limite gratuito da Aiven impede segundo MySQL; o banco demo FlowCore deve ficar isolado em `flowcore_staging`, sem operar sobre `defaultdb`.
- A Fase 9 definiu `flowcore-valkey` como Redis-compatible gerenciado para cache, sessoes, filas e Horizon/Reverb no staging.

## Em Progresso

Fase 9 em andamento na branch `feature/deployment-readiness`.

Proxima etapa recomendada: aplicar o Blueprint no Render Dashboard, preencher segredos `sync: false`, capturar URLs publicas de API/Reverb e entao criar/configurar o site Netlify.

## Bloqueios

Nenhum bloqueio tecnico registrado.

## Lacunas Conhecidas

> [!todo] A CONFIRMAR: owner oficial a ser usado no front-matter dos documentos canonicos. Valor inicial usado: `LuanTrindade95`.
