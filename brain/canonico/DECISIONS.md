---
updated: 2026-06-10
owner: LuanTrindade95
status: canonico
---

# Decisions

Log cronologico resumido das decisoes confirmadas.

## 2026-06-10 - Stack principal

Decisao: usar Angular 19, Laravel 12, MySQL, Redis e Docker.

Por que: a stack permite demonstrar arquitetura full stack moderna, backend robusto, frontend escalavel, persistencia relacional, cache/filas e ambiente reprodutivel.

## 2026-06-10 - Workflow Engine configuravel

Decisao: o FlowCore sera baseado em uma Workflow Engine configuravel, sem fluxos fixos hardcoded.

Por que: o diferencial do produto e permitir que administradores criem etapas, aprovacoes, condicoes e transicoes pela interface, sem alterar codigo.

## 2026-06-10 - Projeto como vitrine de senioridade arquitetural

Decisao: o projeto deve demonstrar State Machine, Event Driven Architecture, filas, scheduler, auditoria e modelagem de dominio.

Por que: o objetivo do FlowCore nao e apenas resolver aprovacoes; ele deve comunicar maturidade tecnica, produto empresarial e capacidade de projetar sistemas escalaveis.

## 2026-06-10 - Markdown + Git com apoio de Obsidian

Decisao: documentacao oficial sera versionada no Git em Markdown, com Obsidian usado como apoio de aprendizado e navegacao.

Por que: Markdown + Git garantem portabilidade, diff e rastreabilidade. Obsidian melhora navegacao humana, backlinks e organizacao conceitual sem virar dependencia obrigatoria do projeto.

## 2026-06-10 - VISION como fonte formal inicial

Decisao: criar `docs/VISION.md`, `docs/DECISIONS.md` e `docs/PROGRESS.md` como documentos formais iniciais do FlowCore.

Por que: o projeto precisa de uma fonte versionada para escopo, stack, separacao Definition vs Runtime, riscos tecnicos, fases e ADRs antes de iniciar codigo de aplicacao.

## 2026-06-10 - Roadmap operacional por fases auditadas

Decisao: usar o pacote operacional FlowCore como guia faseado de execucao, com auditoria por fase antes de avancar.

Por que: o FlowCore tem alto risco arquitetural na engine de workflow; dividir em fases com evidencias evita conclusoes apenas estruturais e protege consistencia de portfolio.

## 2026-06-10 - Monorepo com Docker Compose e CI

Decisao: organizar o projeto em monorepo com `backend/`, `frontend/`, `docker/`, `docker-compose.yml` e CI inicial.

Por que: o FlowCore precisa demonstrar maturidade full stack sem fragmentar a avaliacao tecnica em multiplos repositorios antes do produto existir.

## 2026-06-10 - Docker como runtime de referencia

Decisao: usar Docker Compose como referencia local para PHP 8.3, MySQL, Redis, Horizon, Reverb, backend e frontend.

Por que: o host atual roda PHP 8.2.26, mas o projeto alvo e PHP 8.3. Docker reduz divergencia de ambiente e valida os servicos reais da stack.

## 2026-06-10 - Jest no frontend Angular

Decisao: substituir o alvo Karma/Jasmine por Jest com `jest-preset-angular`.

Por que: Jest simplifica execucao local e CI, reduz atrito de testes no portfolio e mantem feedback rapido para componentes e servicos Angular.

## 2026-06-10 - Pacotes base do builder visual e realtime

Decisao: instalar `@foblex/flow` para canvas de workflow, `laravel-echo`/`pusher-js` para realtime e `@lucide/angular` para icones.

Por que: essas escolhas alinham a fundacao com as fases futuras de builder visual, execucao realtime e interface profissional, evitando dependencia de pacote de icones depreciado.

## 2026-06-10 - Separacao Definition vs Runtime

Decisao: separar tabelas de definicao (`workflow_definitions`, `workflow_steps`, `step_approvers`, `workflow_transitions`, `form_fields`) das tabelas de runtime (`workflow_instances`, `instance_steps`, `instance_step_decisions`, `workflow_actions`).

Por que: definicoes sao configuracao/versionamento; runtime e execucao/auditoria. Separar reduz acoplamento e protege instancias em andamento contra mudancas futuras no builder.

## 2026-06-10 - Version pin em workflow_instances

Decisao: persistir `definition_version` em cada `workflow_instance`.

Por que: a instancia precisa preservar a versao da definicao usada no inicio do processo, mesmo que a definicao seja editada/publicada novamente em fases futuras.

## 2026-06-10 - State machines fixas em codigo

Decisao: usar enums PHP e metodos `transitionTo()` nos models `WorkflowInstance` e `InstanceStep`, lancando excecao em transicao invalida.

Por que: o grafo do workflow e dado, mas o ciclo de vida de instancia/step e regra fixa do dominio. Isso cria uma base simples e testavel para a engine.
