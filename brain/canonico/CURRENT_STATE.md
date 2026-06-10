---
updated: 2026-06-10
owner: LuanTrindade95
status: canonico
---

# Current State

## Resumo

FlowCore e uma plataforma de automacao de processos empresariais configuraveis. Empresas usam o sistema para criar e executar fluxos de solicitacao, aprovacao e operacoes internas sem alterar codigo.

## Estado Atual

O projeto esta com a fundacao tecnica inicial e a modelagem de dominio/dados implementadas e validadas localmente.

Existe no repositorio:

- `README.md` com stack, estrutura, comandos e regras iniciais.
- `LICENSE` MIT.
- `.gitattributes`.
- Dev Brain inicial em `brain/`.
- Documentos formais iniciais em `docs/`:
  - `docs/VISION.md`
  - `docs/DECISIONS.md`
  - `docs/PROGRESS.md`
- Backend Laravel 12 em `backend/`.
- Frontend Angular 19 standalone em `frontend/`.
- Infra local com Docker Compose, MySQL 8, Redis 7, Horizon, Reverb e frontend.
- CI inicial em `.github/workflows/ci.yml`.
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

Ainda nao existe:

- Arquitetura tecnica detalhada fora da visao inicial.
- Fluxos completos do produto fora do roadmap faseado.
- Backlog tecnico.

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

## Em Progresso

- Execucao auditada das fases do FlowCore a partir do pacote de prompts.
- Fase atual: fechamento e auditoria da Fase 3A na branch `feature/backend-auth-rbac`.

## Bloqueios

Nenhum bloqueio tecnico registrado.

## Lacunas Conhecidas

> [!todo] A CONFIRMAR: owner oficial a ser usado no front-matter dos documentos canonicos. Valor inicial usado: `LuanTrindade95`.

> [!todo] A CONFIRMAR: politica final de publicacao/versionamento imutavel durante a Fase 3B.
