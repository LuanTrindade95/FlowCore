# Staging Plan

Este plano prepara o FlowCore para avaliacao externa sem criar recursos em nuvem nesta fase.

## Decisao Da Fase 7

Escopo aprovado pelo PO:

- nao criar servicos externos sem aprovacao especifica;
- trabalhar apenas com free tier/local;
- preparar staging documentado e evidencias de portfolio;
- usar `feature/root-gates` como base;
- tratar o banco demo como resetavel;
- versionar poucas imagens selecionadas.

## Recomendacao Atual

Para a proxima aprovacao operacional, a estrategia mais coerente e:

1. **Local demo como referencia oficial agora**
   - Mantem a stack completa: Angular, Laravel, MySQL, Redis, Horizon e Reverb.
   - Usa a seed idempotente para restaurar a vitrine.
   - Nao depende de custos, limites ou contas externas.

2. **Netlify apenas para frontend estatico**
   - Bom encaixe para a SPA Angular.
   - Nao hospeda o backend Laravel, workers, scheduler ou WebSocket Reverb como servicos long-running.
   - Exige backend publico configurado antes de virar demo funcional.

3. **Render como candidato para backend full stack**
   - Melhor encaixe entre as opcoes para API Laravel, workers, scheduler e servicos web.
   - O free tier e bom para prova de conceito, mas tem spin down em web services ociosos.
   - No free tier, o template validado modela o scheduler como worker; cron dedicado fica como opcao futura paga/aprovada.
   - Deploy real deve ser aprovado separadamente porque exige conta, Git remoto e variaveis sensiveis.

4. **Aiven como candidato para dados gerenciados**
   - Pode cobrir MySQL e Valkey/Redis-compatible em free tier.
   - Mantem dados fora da plataforma de app, melhorando separacao operacional.
   - Para demo gratuita, deve ser usado apenas se o PO aceitar depender de conta externa.

## Fontes Oficiais Consultadas

- Netlify Pricing: <https://www.netlify.com/pricing/>
- Netlify Angular deploy guide: <https://docs.netlify.com/build/frameworks/framework-setup-guides/angular/>
- Render Pricing: <https://render.com/pricing>
- Render Free docs: <https://render.com/docs/free>
- Aiven Pricing: <https://aiven.io/pricing>
- Aiven MySQL free tier: <https://aiven.io/docs/products/mysql/concepts/mysql-free-tier>
- Aiven Valkey docs: <https://aiven.io/docs/products/valkey>

## Estado Atual Do Codigo Para Deploy Externo

Depois da Fase 8, os bloqueios tecnicos iniciais foram reduzidos:

- o frontend carrega `/config.json` antes do bootstrap;
- `frontend/scripts/write-runtime-config.mjs` gera config por variaveis `FLOWCORE_*`;
- `netlify.toml` documenta build estatico da SPA e rewrite para rotas Angular;
- `/health` existe no backend para health checks;
- exemplos de env vivem em `docs/env/`;
- Render e Aiven possuem templates/checklists documentais em `deploy/`.

Ainda nao deve haver deploy externo sem aprovacao especifica porque:

- nenhum recurso externo foi criado;
- nao ha Git remoto confirmado para deploy;
- URLs reais de API/Reverb ainda nao foram aprovadas;
- segredos e credenciais precisam ser preenchidos fora do Git;
- a politica de reset do banco demo precisa ser aprovada por plataforma.

## Arquitetura Alvo Futuramente Aprovavel

```text
Netlify
  Angular SPA
  build: npm ci && npm run build:staging
  publish: dist/frontend/browser

Render
  Laravel API web service
  Horizon worker
  Scheduler worker no free tier
  Reverb web service

Aiven
  MySQL free tier
  Valkey free tier for Redis-compatible cache/queue/session
```

## Variaveis De Ambiente Para Staging

### Backend Laravel

```text
APP_ENV=staging
APP_DEBUG=false
APP_URL=https://<backend-url>
FRONTEND_URL=https://<frontend-url>
FRONTEND_URLS=https://<frontend-url>
APP_KEY=<secret>

DB_CONNECTION=mysql
DB_HOST=<mysql-host>
DB_PORT=<mysql-port>
DB_DATABASE=<mysql-database>
DB_USERNAME=<mysql-user>
DB_PASSWORD=<secret>

REDIS_CLIENT=phpredis
REDIS_HOST=<valkey-or-redis-host>
REDIS_PASSWORD=<secret-or-null>
REDIS_PORT=<redis-port>

SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
CACHE_STORE=redis
BROADCAST_CONNECTION=reverb

REVERB_APP_ID=<secret>
REVERB_APP_KEY=<public-key>
REVERB_APP_SECRET=<secret>
REVERB_HOST=<public-reverb-host>
REVERB_BROADCAST_HOST=<internal-or-public-reverb-host>
REVERB_PORT=443
REVERB_SCHEME=https
REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=${PORT}
```

### Frontend Angular

O frontend usa `/config.json` carregado em runtime.

```text
FLOWCORE_API_BASE_URL=https://<backend-url>/api/v1
FLOWCORE_REALTIME_APP_KEY=<public-reverb-key>
FLOWCORE_REALTIME_AUTH_ENDPOINT=https://<backend-url>/api/broadcasting/auth
FLOWCORE_REALTIME_WS_HOST=<public-reverb-host>
FLOWCORE_REALTIME_WS_PORT=443
FLOWCORE_REALTIME_FORCE_TLS=true
```

Detalhes: `docs/DEPLOYMENT_READINESS.md`.

## Runbook Local De Staging

Pre-condicoes:

- Docker Desktop ativo.
- Branch atual com Fase 6 e root gates.
- Nenhum servico externo necessario.

Passos:

```powershell
docker compose up -d --build
docker compose exec -T backend php artisan migrate --force
docker compose exec -T backend php artisan db:seed --force
npm run fitness
```

Verificacao:

- abrir `http://localhost:4200/login`;
- entrar como `admin@demo.com` / `password`;
- conferir Dashboard;
- abrir Workflows e confirmar `Aprovacao de Compra` e `Pedido de Ferias`;
- abrir mobile width e confirmar ausencia de overflow horizontal.

Rollback local:

```powershell
docker compose down
docker compose up -d --build
docker compose exec -T backend php artisan migrate:fresh --seed
```

## Stop Criteria Para Deploy Real

Nao executar deploy externo enquanto qualquer item abaixo estiver pendente:

- PO aprovar plataforma e criacao de contas/servicos.
- Git remoto existir e estar atualizado.
- Config frontend deixar de depender de `localhost`.
- Variaveis de ambiente de staging estiverem mapeadas.
- Estrategia de banco resetavel for aceita por escrito.
- Smoke externo estiver roteirizado.

## Proxima Fase Recomendada

`Fase 9 - Platform Approval + External Smoke`, caso o PO aprove uma plataforma especifica.

Escopo:

- aprovar plataforma e workspace;
- criar recursos externos manualmente ou via IaC aprovado;
- configurar secrets fora do Git;
- rodar migrations/seed no banco demo resetavel;
- executar smoke externo completo.
