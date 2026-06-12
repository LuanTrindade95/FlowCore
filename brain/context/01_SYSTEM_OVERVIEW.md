# System Overview

## O Que E

FlowCore e uma plataforma de automacao de processos empresariais configuraveis. O sistema permite criar e executar fluxos de solicitacao, aprovacao e operacoes internas sem alterar codigo.

## Quem Usa

Empresas que precisam automatizar aprovacoes e processos internos com regras configuraveis.

## Estado Atual

Projeto full stack implementado localmente e validado ate a Fase 7 do build-loop. O produto ja possui backend Laravel, frontend Angular, banco MySQL, Redis, Horizon, Reverb, Workflow Engine configuravel, builder visual, runtime operacional, automacoes de SLA, realtime privado, dataset demo idempotente, staging documentado e evidencias visuais versionadas.

## Stack Decidida

- Frontend: Angular 19.
- Backend: Laravel 12.
- Banco relacional: MySQL.
- Cache, filas e jobs: Redis.
- Realtime: Laravel Reverb com Echo/Pusher protocol.
- Ambiente: Docker Compose.

## Diferencial Do Produto

O FlowCore sera uma Workflow Engine dinamica. Administradores poderao configurar etapas, aprovacoes, condicoes e transicoes pela interface, evitando fluxos fixos no codigo.

## Capacidades Implementadas

- Auth API com Sanctum Bearer token, RBAC e formato JSON padrao de erro.
- Definition API com workflows, steps, approvers, transitions, form fields, publish e versionamento imutavel por draft.
- Workflow Engine com start, decide, advance, reassign, comment, state machines fixas, condicoes sandboxed e lock pessimista para decisoes.
- Frontend Angular com login, shell autenticado, guards, UI kit, builder visual Foblex, form builder, runtime de solicitacoes, inbox e dashboard.
- Escalonamento de SLA por scheduler e refresh realtime em canais privados por usuario.
- Seed demo reproduzivel com 10 usuarios, 2 workflows publicados e 10 instancias variadas.
- Staging documentado em `docs/STAGING_PLAN.md`, sem provisionamento externo.
- Roteiro de demo E2E local em `docs/DEMO_E2E_SCRIPT.md`.
- Screenshots de portfolio em `docs/assets/screenshots/`.

## Capacidades Que O Projeto Deve Demonstrar

- State Machine.
- Event Driven Architecture.
- Filas.
- Scheduler.
- Auditoria.
- Modelagem de dominio.
- UX de plataforma SaaS empresarial.

## Como Rodar

Ambiente de referencia:

```powershell
docker compose up -d --build
docker compose exec -T backend php artisan migrate --seed
```

URLs locais:

- Frontend: `http://localhost:4200`
- Backend API: `http://localhost:8000/api/v1`
- Reverb: `ws://localhost:8080`

Contas demo:

- Admin: `admin@demo.com` / `password`
- Aprovador: `approver@demo.com` / `password`
- Solicitante: `requester@demo.com` / `password`
