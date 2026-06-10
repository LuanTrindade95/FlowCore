---
updated: 2026-06-10
owner: LuanTrindade95
status: canonico
---

# Next Actions

## Ordem Recomendada

1. Concluir auditoria da Fase 4A contra `docs/VISION.md`, `docs/PROGRESS.md`, rotas Angular, AuthService, guards, interceptors, UI kit, login real e smoke Playwright.
2. Se a Fase 4A for aprovada, executar Fase 4B - Frontend Builder Visual + Form Builder:
   - lista de workflows e versoes
   - canvas `/admin/workflows/:id/builder` com `@foblex/flow`
   - painel lateral de step/transition/approvers
   - form builder para `form_fields`
   - publish com exibicao de erros 422 do `GraphValidator`
3. Manter uma branch por fase e commits granulares.
4. Atualizar `docs/DECISIONS.md`, `docs/PROGRESS.md` e o Brain no fechamento de cada fase.
5. Nao implementar runtime frontend antes da Fase 4C.

## Primeira Sessao Recomendada

Fase 4A ja foi implementada na branch `feature/frontend-foundation`.

Evidencias esperadas antes de avancar:

- `npm run typecheck`, `npm run lint`, Jest e build verdes
- Jest cobrindo AuthService, errorInterceptor 401, permissionGuard e locale pt-BR
- Docker frontend servindo o bundle atual em `http://localhost:4200`
- smoke Playwright de login admin e shell autenticado em desktop/mobile
- ADRs e progresso atualizados
- veredicto `APROVADO` do verificador
