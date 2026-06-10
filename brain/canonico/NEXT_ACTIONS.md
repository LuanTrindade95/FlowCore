---
updated: 2026-06-10
owner: LuanTrindade95
status: canonico
---

# Next Actions

## Ordem Recomendada

1. Concluir auditoria da Fase 3A contra `docs/VISION.md`, `docs/PROGRESS.md`, rotas API, policies, testes e smoke HTTP.
2. Se a Fase 3A for aprovada, executar Fase 3B - Backend Workflow Definition API:
   - CRUD de definicoes draft
   - steps/transitions/approvers/form_fields
   - publicacao e validacao de grafo
   - versionamento/imutabilidade
3. Manter uma branch por fase e commits granulares.
4. Atualizar `docs/DECISIONS.md`, `docs/PROGRESS.md` e o Brain no fechamento de cada fase.
5. Nao implementar engine, builder ou runtime antes das fases especificas.

## Primeira Sessao Recomendada

Fase 3A ja foi implementada na branch `feature/backend-auth-rbac`.

Evidencias esperadas antes de avancar:

- Pest cobrindo login valido/invalido, `/me`, 401 e 403
- Pint verde
- smoke HTTP de login admin@demo.com + `/me`
- ADRs e progresso atualizados
- veredicto `APROVADO` do verificador
