---
updated: 2026-06-12
owner: LuanTrindade95
status: canonico
---

# Next Actions

## Ordem Recomendada

1. Aplicar o Blueprint Render publicado em `main`:
   - repo: `https://github.com/LuanTrindade95/FlowCore`;
   - arquivo: `render.yaml`;
   - Dashboard: `https://dashboard.render.com/blueprint/new?repo=https://github.com/LuanTrindade95/FlowCore`.
2. Preencher no Render os segredos `sync: false` fora do Git:
   - `APP_KEY`;
   - credenciais Aiven MySQL do usuario `flowcore_app`;
   - credenciais Aiven Valkey do usuario `default`;
   - `REVERB_APP_ID`, `REVERB_APP_KEY`, `REVERB_APP_SECRET`;
   - `APP_URL`, `FRONTEND_URL`, `FRONTEND_URLS`, `REVERB_HOST`, `REVERB_BROADCAST_HOST`.
3. Depois que `flowcore-api` e `flowcore-reverb` estiverem `live`, criar/configurar Netlify com as variaveis `FLOWCORE_*`.
4. Rodar migracoes/seed apenas no banco Aiven `flowcore_staging`; nunca rodar reset em `defaultdb`.
5. Executar smoke externo: `/health`, login, dashboard, runtime inbox/detalhe e realtime basico.
6. Manter seed demo idempotente como base obrigatoria de qualquer E2E local ou staging.
7. Atualizar `docs/DECISIONS.md`, `docs/PROGRESS.md` e o Brain no fechamento de cada fase.

## Estado Atual

Fase 9 esta em andamento na branch `feature/deployment-readiness` e tambem foi promovida para `main`.

Evidencias registradas:

- Commit funcional: `466f0f7 feat(deploy): prepare staging runtime configuration`
- Blueprint Render: `14cdb59 feat(deploy): add staging blueprint`
- Ajuste validado do Blueprint free-tier: `beb74e8 fix(deploy): validate render free-tier blueprint`
- Root gate `npm run fitness` verde
- `npm run guard:migrations` verde
- `npm run check:enforcement` verde
- `npm --prefix frontend run build:staging` verde
- Browser local validou `/config.json`, login e dashboard sem erros de console
- Docker seed `php artisan db:seed --force` usado para restaurar dados demo antes do smoke autenticado
- veredicto `APROVADO` do verificador local
