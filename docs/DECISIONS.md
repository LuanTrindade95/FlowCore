# Architecture Decision Records (ADR)

Cada decisao arquitetural relevante deve virar uma entrada no formato `## ADR-NN - titulo`, contendo `Contexto`, `Decisao` e `Consequencias`.

## ADR-01 - Monorepo com backend, frontend e infra versionados juntos

### Contexto

O FlowCore precisa demonstrar um produto full stack empresarial, com API Laravel, SPA Angular, realtime, filas, banco relacional, cache e ambiente local reproduzivel.

### Decisao

Usar um monorepo com:

- `backend/` para Laravel 12.
- `frontend/` para Angular 19.
- `docker/` e `docker-compose.yml` para runtime local.
- `.github/workflows/ci.yml` para checks basicos de backend e frontend.

### Consequencias

- Facilita revisao de mudancas full stack por fase.
- Mantem setup de portfolio mais simples para avaliacao tecnica.
- Exige disciplina para nao misturar escopos grandes no mesmo commit.

## ADR-02 - Docker Compose como ambiente local de referencia

### Contexto

O ambiente local Windows possui PHP 8.2.26, enquanto a stack alvo do projeto usa PHP 8.3. O projeto tambem depende de MySQL, Redis, Horizon e Reverb.

### Decisao

Usar Docker Compose como ambiente de referencia com MySQL 8, Redis 7, backend Laravel, Horizon, Reverb e frontend Angular.

### Consequencias

- Reduz divergencia entre maquinas locais e CI.
- Permite validar a stack completa sem instalar todos os servicos no host.
- O host ainda pode executar checks rapidos, mas Docker e CI sao a referencia para PHP 8.3.

## ADR-03 - Angular 19 standalone com Jest e Tailwind

### Contexto

O frontend precisa ser moderno, testavel e adequado para uma experiencia SaaS profissional. O scaffold padrao do Angular ainda traz Karma/Jasmine, mas o projeto busca testes rapidos e integracao simples em CI.

### Decisao

Usar Angular 19 standalone, Tailwind CSS v4, Jest com `jest-preset-angular`, ESLint Angular e aliases `@app/*`.

### Consequencias

- Reduz custo de execucao de testes no CI.
- Mantem arquitetura compativel com lazy loading, Signals/RxJS e componentes standalone.
- Exige configuracao explicita de Jest e remocao do alvo Karma.

## ADR-04 - Bibliotecas base para builder visual, realtime e icones

### Contexto

O roadmap exige um builder visual de workflows, realtime e interface polida. As bibliotecas precisam ser compativeis com Angular 19 e nao devem introduzir dependencias depreciadas.

### Decisao

Usar:

- `@foblex/flow` para o futuro canvas de workflow.
- `laravel-echo` e `pusher-js` para realtime com Reverb.
- `@lucide/angular` para icones, substituindo o pacote depreciado `lucide-angular`.

### Consequencias

- O canvas visual parte de uma biblioteca especializada, reduzindo risco de reinventar grafo/arraste/conectores.
- O realtime fica alinhado ao ecossistema Laravel/Reverb.
- A escolha de icones evita dependencia depreciada ainda na fundacao.

## ADR-05 - Separacao Definition vs Runtime com version pin

### Contexto

O FlowCore precisa permitir que administradores publiquem definicoes de workflow e que instancias ja abertas continuem presas a versao em que nasceram. Misturar dados de definicao com execucao criaria risco de alterar processos em andamento quando uma definicao fosse editada no futuro.

### Decisao

Separar o dominio em dois lados:

- Definition: `workflow_definitions`, `workflow_steps`, `step_approvers`, `workflow_transitions` e `form_fields`.
- Runtime: `workflow_instances`, `instance_steps`, `instance_step_decisions` e `workflow_actions`.

Cada `workflow_instance` guarda `workflow_definition_id` e `definition_version`.

### Consequencias

- Instancias podem ser auditadas contra a versao de definicao usada na abertura.
- A publicacao/versionamento da Fase 3B tera uma base explicita.
- Consultas de runtime ficam separadas das tabelas de configuracao do builder.

## ADR-06 - Maquinas de estado fixas para instancia e step

### Contexto

O grafo de workflow e dirigido por dados, mas o ciclo de vida de uma instancia e de um step deve ser pequeno, previsivel e testavel. Estados livres em banco aumentariam risco de transicoes impossiveis e bugs silenciosos na engine.

### Decisao

Modelar estados com enums PHP e transicoes fixas:

- Instancia: `running -> approved|rejected|cancelled|completed`.
- Step: `pending -> in_progress|skipped|escalated`; `in_progress -> approved|rejected|skipped|escalated|completed`; `escalated -> in_progress|approved|rejected|completed`.

Transicao invalida lanca `InvalidWorkflowStateTransition`.

### Consequencias

- A Fase 3C pode focar na engine `start/decide/advance`, reutilizando invariantes de estado ja testadas.
- Testes conseguem provar transicoes validas e invalidas sem depender de endpoints.
- O dominio evita aceitar status arbitrario por acidente.

## ADR-07 - Sanctum token API e formato JSON padrao

### Contexto

O frontend Angular consumira uma API REST versionada. A Fase 3A precisava entregar autenticacao real, autorizacao baseada em RBAC e respostas JSON previsiveis para erros 401, 403 e 422.

### Decisao

Usar Laravel Sanctum com tokens Bearer para `/api/v1/auth/login`, `/api/v1/auth/logout` e `/api/v1/auth/me`. Padronizar erros de API no formato:

```json
{
  "message": "Mensagem em pt-BR.",
  "code": "ERROR_CODE",
  "errors": {}
}
```

### Consequencias

- O frontend pode tratar login, sessao expirada, falta de permissao e validacao sem parsing fragil.
- Policies e middleware `permission:*` usam as permissions seedadas na Fase 2.
- A estrategia de armazenamento do token no frontend ainda sera decidida na Fase 4A.

## ADR-08 - Validacao de grafo na publicacao

### Contexto

O builder visual pode persistir drafts incompletos durante a edicao, mas uma definicao publicada precisa ser executavel pela engine futura. Publicar grafo invalido deslocaria erro estrutural para o runtime.

### Decisao

Executar `GraphValidator` em `POST /api/v1/workflows/{id}/publish`, agregando erros em 422 quando houver:

- zero ou mais de uma etapa inicial
- etapa nao alcancavel a partir do start
- ciclo no grafo
- etapa sem caminho para terminal
- `condition_expression` com sintaxe invalida no `symfony/expression-language`

As condicoes sao apenas parseadas nesta fase; avaliacao booleana fica para a engine da Fase 3C.

### Consequencias

- Drafts continuam flexiveis para o builder.
- Publicacao passa a ser o gate estrutural oficial.
- A engine futura recebe definicoes com invariantes minimas garantidas.

## ADR-09 - Versionamento imutavel por draft explicito

### Contexto

Definicoes publicadas devem ser imutaveis para nao alterar instancias futuras ou em andamento de forma silenciosa. Ao mesmo tempo, o administrador precisa evoluir um fluxo publicado.

### Decisao

Atualizacao direta de definicao publicada retorna 422. Para evoluir um fluxo, usar `POST /api/v1/workflows/{id}/draft`, que clona a definicao publicada para uma nova versao `draft` com steps, approvers, transitions e form fields.

### Consequencias

- A versao publicada permanece auditavel e intacta.
- O builder edita somente drafts.
- O contrato da API evita efeitos colaterais escondidos em uma tentativa de update.
