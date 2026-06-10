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

## 2026-06-10 - Sanctum Bearer token para API

Decisao: implementar login/logout/me em `/api/v1/auth/*` com Laravel Sanctum e Bearer tokens.

Por que: a SPA Angular precisa de um contrato simples para autenticar requests de API. A decisao de armazenamento do token no frontend fica para a Fase 4A.

## 2026-06-10 - Formato JSON padrao de erro

Decisao: padronizar erros de API em `{ message, code, errors? }` para validacao, autenticacao, autorizacao e HTTP errors comuns.

Por que: o frontend consegue tratar 401, 403, 422 e erros de formulario sem depender de mensagens soltas ou respostas HTML.

## 2026-06-10 - Validacao de grafo no publish

Decisao: drafts podem estar incompletos, mas `POST /api/v1/workflows/{id}/publish` roda `GraphValidator` para validar start unico, alcance de steps, ausencia de ciclos, caminho para terminal e sintaxe de condicoes.

Por que: a engine deve receber apenas definicoes publicadas estruturalmente executaveis; erros de builder devem aparecer antes do runtime.

## 2026-06-10 - Nova versao draft por endpoint explicito

Decisao: update direto em definicao publicada retorna 422; evoluir uma publicada exige `POST /api/v1/workflows/{id}/draft`, que clona grafo e form schema para nova versao draft.

Por que: evita efeito colateral escondido em operacoes de update e preserva auditoria/versionamento imutavel.

## 2026-06-10 - Engine backend dirigida pelo grafo publicado

Decisao: implementar `WorkflowEngine` como servico de dominio para iniciar instancias, registrar decisoes, avancar steps, reatribuir e comentar.

Por que: controllers devem orquestrar HTTP, enquanto invariantes de execucao, auditoria e transicoes pertencem ao dominio da engine.

## 2026-06-10 - Sandbox de condicoes da engine

Decisao: avaliar `condition_expression` com `symfony/expression-language`, expondo apenas variaveis vindas de `workflow_instances.data`.

Por que: condicoes precisam ser configuraveis sem abrir acesso a funcoes, objetos ou ambiente externo.

## 2026-06-10 - Rejeicao roteavel ou terminal

Decisao: quando uma decisao e `reject`, a engine tenta transition `rejected`; se nenhuma transition for aplicavel, encerra a instancia como `rejected`.

Por que: isso permite fluxos com revisao/correcao quando configurados, mas preserva comportamento seguro e previsivel para workflows simples.

## 2026-06-10 - Concorrencia de decisoes por lock pessimista

Decisao: processar decisoes com transacao e `lockForUpdate` no `InstanceStep`, revalidando estado e duplicidade depois do lock.

Por que: steps com quorum nao podem aceitar duas decisoes simultaneas que dobrem contadores ou fechem o mesmo step duas vezes.

## 2026-06-10 - Token frontend em memoria

Decisao: manter o Bearer token somente em memoria no `AuthService`, sem persistencia em `localStorage`.

Por que: reduz exposicao de credencial no browser enquanto o projeto ainda nao tem cookie httpOnly/BFF ou refresh token.

## 2026-06-10 - Estado frontend com Signals

Decisao: usar Angular Signals para autenticacao, loading e feedback, sem adicionar NgRx ao FlowCore.

Por que: a Fase 4A precisa de estado simples e previsivel; store global seria custo sem necessidade concreta.

## 2026-06-10 - Playwright para smoke visual

Decisao: adicionar `@playwright/test` como dev dependency para validar login e shell autenticado em Chromium desktop/mobile.

Por que: a fundacao frontend precisa de evidencia visual reproduzivel, nao apenas typecheck/build.

## 2026-06-10 - Canvas Foblex controlado pela feature

Decisao: usar `@foblex/flow` para a superficie visual do builder, mantendo serializacao, selecao e persistencia na feature Angular e nos endpoints Laravel.

Por que: o canvas nao deve virar fonte de verdade do workflow; ele renderiza e facilita interacao, enquanto o contrato de dominio segue nos sub-recursos da API.

## 2026-06-10 - Publish 422 como feedback visual do builder

Decisao: renderizar `errors.graph` retornado pelo backend no publish e destacar nodes/transitions por `meta.step_id` e `meta.transition_id`.

Por que: duplicar o `GraphValidator` no Angular criaria divergencia; o frontend deve orientar o usuario sem substituir a autoridade do backend.
