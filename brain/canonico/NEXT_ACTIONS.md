---
updated: 2026-06-12
owner: LuanTrindade95
status: canonico
---

# Next Actions

## Ordem Recomendada

1. Escolher a proxima frente:
   - Fase 9 - Platform Approval + External Smoke, se o PO aprovar plataforma e criacao de recursos externos;
   - Backlog tecnico formal de hardening, se o PO quiser continuar sem recursos externos.
2. Antes de qualquer deploy externo, confirmar plataforma, workspace, Git remoto, URLs, secrets e politica de banco demo resetavel.
3. Nao renomear `deploy/render/render.yaml.example` para `render.yaml` sem aprovacao explicita.
4. Manter os contratos runtime da Fase 4C como autoridade para visibilidade e acoes.
5. Manter seed demo idempotente como base obrigatoria de qualquer E2E local ou staging.
6. Manter uma branch por fase e commits granulares.
7. Atualizar `docs/DECISIONS.md`, `docs/PROGRESS.md` e o Brain no fechamento de cada fase.

## Primeira Sessao Recomendada

Fase 8 ja foi implementada na branch `feature/deployment-readiness`.

Evidencias registradas:

- Commit funcional: `466f0f7 feat(deploy): prepare staging runtime configuration`
- Root gate `npm run fitness` verde
- `npm run guard:migrations` verde
- `npm run check:enforcement` verde
- `npm --prefix frontend run build:staging` verde
- Browser local validou `/config.json`, login e dashboard sem erros de console
- Docker seed `php artisan db:seed --force` usado para restaurar dados demo antes do smoke autenticado
- veredicto `APROVADO` do verificador local
