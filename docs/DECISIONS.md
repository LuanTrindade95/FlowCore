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
