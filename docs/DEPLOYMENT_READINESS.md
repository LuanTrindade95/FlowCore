# Deployment Readiness

Este documento prepara a Fase 8 do FlowCore para deploy externo futuro sem criar recursos em nuvem.

## Status

- Netlify: configurado como candidato para SPA Angular estatica via `netlify.toml`.
- Render: template documental em `deploy/render/render.yaml.example`; nao aplicar sem aprovacao do PO.
- Aiven: checklist documental em `deploy/aiven/free-tier-checklist.md`; nao criar servicos sem aprovacao do PO.
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

O template `deploy/render/render.yaml.example` e apenas referencia. Ele modela:

- API Laravel como web service Docker;
- Horizon como worker;
- scheduler como worker free-tier executando `schedule:run` em loop;
- Reverb como web service separado;
- segredos com `sync: false`;
- `autoDeploy: false`;
- banco e Valkey/Redis externos via Aiven.

Nao renomear para `render.yaml` nem aplicar Blueprint sem aprovacao explicita do PO.

## Aiven

O checklist `deploy/aiven/free-tier-checklist.md` documenta MySQL e Valkey como candidatos para staging futuro. A politica de banco demo deve continuar resetavel:

```powershell
php artisan migrate:fresh --force
php artisan db:seed --force
```

Esse comando so pode rodar em banco aprovado como resetavel.

## Stop Criteria

Nao executar deploy externo enquanto qualquer item abaixo estiver pendente:

- aprovacao por plataforma;
- Git remoto confirmado;
- segredos definidos fora do Git;
- URL publica da API definida;
- URL publica do Reverb definida;
- banco demo resetavel aprovado;
- smoke externo roteirizado;
- `npm run fitness`, `npm run guard:migrations` e `npm run check:enforcement` verdes.
