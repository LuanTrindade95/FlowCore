# FlowCore Architecture

Este documento resume a arquitetura tecnica atual do FlowCore para avaliacao de portfolio e continuidade de desenvolvimento.

## Visao Geral

FlowCore e organizado como monorepo:

- `backend/`: Laravel API, dominio, scheduler, broadcast, seeders e testes.
- `frontend/`: Angular SPA com features lazy, UI kit local e testes.
- `docker/`: imagens locais para backend e frontend.
- `docs/`: documentacao publica do projeto.
- `brain/`: memoria operacional para agentes IA.

## Principio Central

O fluxo e dado, nao codigo.

A aplicacao guarda a definicao do workflow no banco e a engine executa essa definicao em runtime. O que permanece fixo em codigo e o ciclo de vida seguro de instancia e step:

- `WorkflowInstance`: `running`, `approved`, `rejected`, `cancelled`, `completed`.
- `InstanceStep`: `pending`, `in_progress`, `approved`, `rejected`, `skipped`, `escalated`, `completed`.

Essa separacao permite criar novos fluxos sem deploy, preservando invariantes de dominio em codigo testado.

## Camadas Backend

```text
HTTP Controllers
  -> Form Requests
  -> Policies / Permissions
  -> Domain Services
  -> Eloquent Models
  -> API Resources
```

Principais services:

- `WorkflowEngine`: inicia requests, processa decisoes, avanca grafo, reatribui e comenta.
- `ConditionEvaluator`: avalia expressoes em sandbox usando somente `workflow_instances.data`.
- `AssigneeResolver`: resolve assignees por usuario, role ou regra dinamica.
- `WorkflowEscalationService`: escalona steps vencidos de forma idempotente.
- `RuntimeEventDispatcher`: calcula destinatarios e dispara eventos realtime.

## Definition vs Runtime

Definition e configuracao versionada:

- `workflow_definitions`
- `workflow_steps`
- `step_approvers`
- `workflow_transitions`
- `form_fields`

Runtime e execucao auditavel:

- `workflow_instances`
- `instance_steps`
- `instance_step_decisions`
- `workflow_actions`

Uma instancia guarda `definition_version`, preservando o contrato usado no momento da abertura.

## Publicacao E Versionamento

Drafts podem ser incompletos. Publicacao exige:

- um unico step inicial;
- steps alcancaveis a partir do start;
- caminho para terminal;
- ausencia de ciclos invalidos;
- transicoes sem referencias orfas;
- condicoes com sintaxe valida.

Definicoes publicadas nao recebem update direto. Evolucao acontece via endpoint de draft.

## Concorrencia

Decisoes usam transacao e `lockForUpdate` no `InstanceStep`. Depois do lock, a engine revalida:

- status aberto;
- autorizacao;
- duplicidade de decisao;
- threshold de `any`, `all` ou `quorum`.

Isso impede contadores duplicados e fechamento concorrente do mesmo step.

## Realtime

Runtime events usam Laravel Reverb com protocolo Pusher.

Fluxo:

```text
WorkflowEngine / WorkflowEscalationService
  -> RuntimeEventDispatcher
  -> RuntimeWorkflowUpdated
  -> Reverb private channel users.{id}.runtime
  -> Angular RuntimeRealtimeService
  -> refresh de Inbox / Dashboard / Request Detail
```

O endpoint `/api/broadcasting/auth` autentica o canal privado com Sanctum Bearer token e retorna JSON no formato esperado pelo Echo/Pusher.

O backend usa `REVERB_BROADCAST_HOST` para publicar dentro do Docker (`reverb`), enquanto o navegador usa `localhost:8080`.

## Scheduler E SLA

`routes/console.php` agenda:

```text
workflow:escalate-overdue -> everyMinute -> withoutOverlapping
```

O comando busca steps `pending` ou `in_progress` com `due_at <= now()`, faz lock pessimista e registra uma unica action `escalated`.

## Frontend

Angular usa:

- standalone components;
- rotas lazy por feature;
- Signals para auth/loading/local state;
- RxJS para chamadas API e realtime;
- guards por autenticacao e permissao;
- interceptors para Bearer token, loading e erro JSON;
- UI kit local para consistencia visual.

Features principais:

- `auth`: login e estado de sessao.
- `workflows`: lista, builder visual e form builder.
- `runtime`: abertura de requests.
- `requests`: lista e detalhe.
- `inbox`: pendencias acionaveis.
- `dashboard`: metricas operacionais.

## Seed Demo

`DatabaseSeeder` cria usuarios deterministicos e chama `DemoWorkflowSeeder`.

O seed demo e idempotente:

- usa emails fixos para usuarios;
- sincroniza roles;
- atualiza workflows por `slug + version`;
- recria transicoes/approvers dos workflows demo;
- remove apenas instancias runtime marcadas com `payload.seeded=true`;
- recria 10 instancias demo.

Isso permite restaurar uma vitrine local sem duplicar dados.

## Seguranca

- Autenticacao por Sanctum Bearer token.
- RBAC com Spatie Permission.
- Policies em definitions, instances e decisions.
- Erros API em JSON padronizado.
- Condicoes em sandbox, sem `eval`.
- Visibilidade runtime aplicada no backend.
- Realtime privado por usuario.

## Trade-offs Conhecidos

- Token frontend fica apenas em memoria; refresh da SPA exige novo login.
- Realtime faz refresh por tela em vez de aplicar patches client-side, reduzindo risco de estado divergente.
- Seed demo reseta apenas dados marcados como seedados; dados manuais podem coexistir.
- Screenshots nao sao versionados por padrao para evitar binarios ate haver fluxo final de portfolio.
