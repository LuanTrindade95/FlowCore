---
updated: 2026-06-12
owner: LuanTrindade95
status: canonico
---

# Next Actions

## Ordem Recomendada

1. Executar Fase 8 - Deployment Readiness sem provisionar recursos externos:
   - parametrizar URL da API e Reverb no frontend;
   - criar exemplos de variaveis por ambiente sem segredos;
   - preparar configuracao documentada para Netlify/Render/Aiven, se fizer sentido;
   - manter demo DB resetavel como requisito de staging futuro.
2. Solicitar aprovacao especifica do PO antes de criar qualquer recurso em Netlify, Render, Aiven ou plataforma equivalente.
3. Manter os contratos runtime da Fase 4C como autoridade para visibilidade e acoes.
4. Manter seed demo idempotente como base obrigatoria de qualquer E2E local ou staging.
5. Manter uma branch por fase e commits granulares.
6. Atualizar `docs/DECISIONS.md`, `docs/PROGRESS.md` e o Brain no fechamento de cada fase.

## Primeira Sessao Recomendada

Fase 7 ja foi implementada na branch `feature/deploy-staging-evidence`.

Evidencias registradas:

- Commit funcional: `1a81395 docs(portfolio): add staging plan and visual evidence`
- Root gate `npm run fitness` verde
- `npm run guard:migrations` verde
- `npm run check:enforcement` verde
- Docker seed `php artisan db:seed --force` verde
- Playwright validou e gerou screenshots desktop de login, dashboard e workflows
- `godmode test`, `godmode verify`, `godmode polish` e `godmode end` verdes
- veredicto `APROVADO` do verificador local
