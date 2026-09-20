# Deployment Readiness

Este documento registra a prontidao de deploy do FlowCore e o estado de staging externo.

## Status

- Netlify: site no ar em `https://flowcore-luantrindade.netlify.app` (`200`), servindo `/config.json` com as URLs publicas corretas de API e Reverb.
- Render: Blueprint real em `render.yaml` aplicado; `flowcore-api` (`https://flowcore-api-urkx.onrender.com`) e `flowcore-reverb` (`wss://flowcore-reverb.onrender.com:443`) no ar e respondendo `/health` com `200`. Smoke externo de login (`POST /api/v1/auth/login`) esta bloqueado com `500 Server Error`; a rota de validacao (sem tocar banco) responde `422` normalmente, entao a falha esta isolada ao acesso a banco/Redis. Diagnostico levado ao humano; nao investigar/alterar credenciais aqui.
- Aiven: Valkey free-tier criado para FlowCore; MySQL free-tier ja estava ocupado, entao FlowCore usa banco e usuario isolados no servico MySQL existente. Migracao/seed do banco `flowcore_staging` ainda nao confirmados dado o bloqueio acima.
- Frontend: configuracao runtime carregada de `/config.json`.
- Backend: `/health` disponivel para health checks de plataforma.

## Frontend Runtime Config

O Angular carrega `/config.json` antes do bootstrap. Em localhost, se o arquivo estiver indisponivel, o app usa os defaults locais. Fora de localhost, a ausencia do arquivo falha fechado para evitar que uma build externa tente chamar `localhost`.

Arquivo local versionado:

```text
frontend/public/config.json
```

Exemplo de staging:

```text
frontend/public/config.staging.example.json
```

Geracao por variaveis:

```powershell
cd frontend
npm run config:runtime
npm run build:staging
```

Variaveis esperadas:

```text
FLOWCORE_API_BASE_URL
FLOWCORE_REALTIME_APP_KEY
FLOWCORE_REALTIME_AUTH_ENDPOINT
FLOWCORE_REALTIME_WS_HOST
FLOWCORE_REALTIME_WS_PORT
FLOWCORE_REALTIME_FORCE_TLS
```

## Netlify

`netlify.toml` fica na raiz do monorepo e usa:

```text
base: frontend
command: npm ci && npm run build:staging
publish: frontend/dist/frontend/browser
```

O arquivo tambem define rewrite SPA para `index.html` e `Cache-Control: no-store` para `/config.json`.

O site ja foi criado em `https://flowcore-luantrindade.netlify.app` com as variaveis `FLOWCORE_*` de staging aplicadas no escopo de build.

## Render

O Blueprint `render.yaml` modela:

- `flowcore-api`: API Laravel como web service Docker (`plan: free`), rodando `php artisan serve`;
- `flowcore-reverb`: Reverb como web service Docker separado (`plan: free`), rodando `php artisan reverb:start`;
- `QUEUE_CONNECTION=sync`: o free tier nao provisiona Horizon nem worker/scheduler dedicado, entao filas rodam de forma sincrona e o escalonamento de SLA (`workflow:escalate-overdue`) nao executa periodicamente em staging;
- segredos com `sync: false`;
- `autoDeploy: false`;
- banco e Valkey/Redis externos via Aiven.

O Blueprint ja foi aplicado no Dashboard com os segredos `sync: false` preenchidos fora do Git.

## Aiven

Estado configurado em `portfolio-01`:

- MySQL: servico existente `portfolio`, plano `free-1-1gb`, banco isolado `flowcore_staging`, usuario isolado `flowcore_app`;
- Valkey: servico `flowcore-valkey`, plano `free-1`, estado `RUNNING`;
- Credenciais continuam fora do Git.

A politica de banco demo deve continuar resetavel apenas no banco `flowcore_staging`:

```powershell
php artisan migrate:fresh --force
php artisan db:seed --force
```

Esse comando so pode rodar em banco aprovado como resetavel.

## Stop Criteria

Nao executar deploy externo enquanto qualquer item abaixo estiver pendente:

- Blueprint Render aplicado;
- segredos definidos fora do Git;
- URL publica da API definida;
- URL publica do Reverb definida;
- Netlify criado/configurado com as URLs publicas;
- smoke externo roteirizado;
- `npm run fitness`, `npm run guard:migrations` e `npm run check:enforcement` verdes.
