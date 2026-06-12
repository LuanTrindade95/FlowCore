# FlowCore

FlowCore e uma plataforma SaaS de workflow configuravel. O produto permite que times de negocio modelem fluxos de solicitacao, aprovacao, SLA e auditoria sem alterar codigo ou depender de deploy para cada mudanca de processo.

O foco deste repositorio e demonstrar arquitetura full stack senior: engine dirigida por dados, builder visual, versionamento de definicoes, runtime auditavel, autorizacao server-side, filas, scheduler e realtime operacional.

## O Que O Produto Resolve

Empresas frequentemente operam aprovacoes em e-mail, planilhas ou fluxos hardcoded. Isso cria baixa rastreabilidade e faz qualquer mudanca depender de TI.

FlowCore separa a definicao do processo da execucao:

- Administradores configuram steps, transicoes, formularios, aprovadores e condicoes.
- Solicitantes abrem requests a partir da versao publicada.
- A engine executa o grafo com state machines fixas e regras de negocio testadas.
- Aprovadores recebem pendencias em uma inbox realtime.
- Gestores acompanham SLA, gargalos e historico auditavel.

## Capacidades Implementadas

- Auth e RBAC com Laravel Sanctum e Spatie Permission.
- Builder de workflow com canvas visual usando `@foblex/flow`.
- Form builder por workflow publicado.
- Publicacao com validacao de grafo e versionamento imutavel.
- Runtime de requests com formulario dinamico gerado pelo schema publicado.
- Engine com approve, reject, reassign, comment, quorum, all/any e condicoes.
- Timeline de auditoria por `workflow_actions`.
- SLA escalation por scheduler e comando `workflow:escalate-overdue`.
- Realtime com Reverb/Echo em canais privados por usuario.
- Dashboard operacional, inbox, lista e detalhe de requests.
- Seed demo idempotente para avaliacao local.

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Laravel 12, PHP 8.3, Pest, Pint |
| Auth/RBAC | Sanctum, spatie/laravel-permission |
| Dominio | Eloquent, enums, services, policies, API resources |
| Condicoes | symfony/expression-language em sandbox |
| Banco | MySQL 8 |
| Filas/Scheduler | Redis, Laravel Queue, Horizon, Scheduler |
| Realtime | Laravel Reverb, Echo, Pusher protocol |
| Frontend | Angular 19 standalone, Signals, RxJS |
| UI | Tailwind CSS, lucide icons, UI kit local |
| Builder visual | @foblex/flow |
| Testes frontend | Jest, Angular Testing Library primitives |
| Infra local | Docker Compose |

## Arquitetura Em Uma Pagina

```text
Angular SPA
  |-- AuthService + Guards + Interceptors
  |-- Workflow Builder / Form Builder
  |-- Runtime Requests / Inbox / Dashboard
  |-- RuntimeRealtimeService (Echo)
        |
        v
Laravel API
  |-- Auth/RBAC/Policies
  |-- Definition API
  |-- WorkflowEngine
  |-- Runtime API
  |-- BroadcastAuthController
        |
        +--> MySQL: definitions, runtime, audit trail
        +--> Redis/Horizon: queue infra
        +--> Scheduler: SLA escalation
        +--> Reverb: private runtime channels
```

Detalhes: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Modelo De Dominio

**Definition**

- `workflow_definitions`: nome, slug, versao, status e categoria.
- `workflow_steps`: steps configuraveis do grafo.
- `step_approvers`: aprovadores por usuario, role ou assignee dinamico.
- `workflow_transitions`: arestas do grafo e condicoes.
- `form_fields`: schema do formulario runtime.

**Runtime**

- `workflow_instances`: request aberta contra uma definicao publicada.
- `instance_steps`: execucao dos steps.
- `instance_step_decisions`: decisoes de aprovadores.
- `workflow_actions`: timeline auditavel.

## Decisoes Tecnicas Relevantes

- O grafo do workflow e dado; a state machine de instancia/step e codigo.
- Definicoes publicadas sao imutaveis; nova versao nasce por draft explicito.
- Requests guardam `definition_version` para preservar auditoria.
- Condicoes de transicao sao avaliadas em sandbox com apenas dados da instancia.
- Decisoes usam transacao e `lockForUpdate` para proteger quorum.
- Visibilidade e flags de acao sao autoridade do backend, nao da UI.
- Realtime usa canais privados `users.{id}.runtime`.
- Eventos realtime carregam somente ids e acao; dados completos vem das APIs.

ADRs: [docs/DECISIONS.md](docs/DECISIONS.md).

## Como Rodar Localmente

Requisitos:

- Docker Desktop
- Node/npm apenas se quiser rodar checks frontend no host

Subir a stack:

```powershell
docker compose up --build
```

Popular dados demo:

```powershell
docker compose exec backend php artisan db:seed --force
```

O seed e idempotente. Ele pode ser executado novamente para restaurar os workflows e exemplos demo sem duplicar dados.

Servicos:

- Frontend: http://localhost:4200
- Backend: http://localhost:8000
- Reverb: http://localhost:8080
- MySQL: localhost:3306
- Redis: localhost:6379

## Contas Demo

Todas usam a senha `password`.

| Perfil | E-mail | Uso |
|---|---|---|
| Admin | `admin@demo.com` | Gerenciar workflows, builder e publicacao |
| Aprovador | `approver@demo.com` | Inbox, decisoes e reatribuicao |
| Solicitante | `requester@demo.com` | Abrir e acompanhar requests |

## Roteiro De Avaliacao

1. Login como `admin@demo.com`.
2. Abrir `Admin > Workflows`.
3. Inspecionar `Aprovacao de Compra` no builder visual e no form builder.
4. Login como `requester@demo.com`.
5. Criar uma nova solicitacao de compra com valor acima de `1000`.
6. Login como `approver@demo.com`.
7. Ver a pendencia na Inbox, aprovar ou comentar.
8. Rodar `workflow:escalate-overdue` apos manipular um SLA local para validar realtime.
9. Conferir Dashboard e detalhe da request para timeline e estado.

Roteiro detalhado: [docs/DEMO_E2E_SCRIPT.md](docs/DEMO_E2E_SCRIPT.md).

Evidencias visuais: [docs/assets/screenshots/README.md](docs/assets/screenshots/README.md).

Plano de staging documentado: [docs/STAGING_PLAN.md](docs/STAGING_PLAN.md).

## Checks

Gates agregados do monorepo:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run audit
npm run fitness
```

Gates auxiliares:

```powershell
npm run guard:migrations
npm run check:enforcement
```

Backend isolado:

```powershell
docker compose exec backend ./vendor/bin/pint --test
docker compose exec backend ./vendor/bin/pest
docker compose exec backend composer audit
```

Frontend isolado:

```powershell
cd frontend
npm run typecheck
npm run lint
npm test
npm run build
npm audit --omit=dev
```

## Evidencias Recentes

Fase 6 validada em `feature/portfolio-polish` e tooling raiz validado em `feature/root-gates`:

- Pint passou.
- Pest: 39 testes, 147 assertions.
- Frontend: typecheck, lint, 25 testes Jest e build passaram.
- `npm audit --omit=dev`: 0 vulnerabilidades.
- `composer audit`: sem advisories.
- `godmode verify`: passou com os gates raiz e shim TypeScript do monorepo.
- E2E local: request `#77` mudou de `Pendente` para `Escalada` no Inbox sem reload manual.

Fase 6 adiciona:

- Seed demo idempotente testado em SQLite e MySQL.
- README e arquitetura preparados para avaliacao de portfolio.
- Fase 7 documenta staging sem criar recursos externos e adiciona screenshots versionados.

## Estrutura

```text
backend/   API Laravel, dominio, scheduler, realtime e testes Pest
frontend/  SPA Angular, builder, runtime, UI kit e testes Jest
docker/    Dockerfiles e configuracoes de runtime
docs/      visao, arquitetura, ADRs e progresso por fase
brain/     contexto operacional para agentes IA
```

## Regras Do Projeto

- Produto em pt-BR; codigo, identificadores, colunas, rotas e eventos em ingles.
- Workflow Definition e Runtime sao dominios separados.
- Publicado e imutavel; runtime e auditavel.
- Uma fase so avanca com evidencia empirica.
