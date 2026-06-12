# Deployment Readiness

Este documento registra a prontidao de deploy do FlowCore e o estado de staging externo.

## Status

- Netlify: configurado como candidato para SPA Angular estatica via `netlify.toml`; site ainda nao criado porque depende das URLs publicas do Render.
- Render: Blueprint real em `render.yaml` e template de referencia em `deploy/render/render.yaml.example`.
- Aiven: Valkey free-tier criado para FlowCore; MySQL free-tier ja estava ocupado, entao FlowCore usa banco e usuario isolados no servico MySQL existente.
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
publish: dist/frontend/browser
```

O arquivo tambem define rewrite SPA para `index.html` e `Cache-Control: no-store` para `/config.json`.

Antes de criar site no Netlify, o PO precisa aprovar:

- conta/workspace;
- dominio ou subdominio;
- URL publica da API;
- variaveis `FLOWCORE_*` no escopo de build;
- smoke externo.

## Render

O Blueprint `render.yaml` modela:

- API Laravel como web service Docker;
- Horizon como worker;
- scheduler como worker free-tier executando `schedule:run` em loop;
- Reverb como web service separado;
- segredos com `sync: false`;
- `autoDeploy: false`;
- banco e Valkey/Redis externos via Aiven.

O deploy Render ainda exige aplicar o Blueprint no Dashboard e preencher os segredos `sync: false` fora do Git.

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
