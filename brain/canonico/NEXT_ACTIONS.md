---
updated: 2026-06-10
owner: LuanTrindade95
status: canonico
---

# Next Actions

## Ordem Recomendada

1. Concluir auditoria da Fase 3C contra `docs/VISION.md`, `docs/PROGRESS.md`, services da engine, rotas runtime, testes e smokes HTTP.
2. Se a Fase 3C for aprovada, executar Fase 4A - Frontend Fundacao:
   - arquitetura Angular escalavel por features
   - auth client e guards
   - layout SaaS profissional
   - design tokens e componentes base
   - interceptors para token, loading e erros JSON da API
   - smoke visual em desktop e mobile
3. Manter uma branch por fase e commits granulares.
4. Atualizar `docs/DECISIONS.md`, `docs/PROGRESS.md` e o Brain no fechamento de cada fase.
5. Nao implementar builder visual nem runtime frontend antes das fases especificas.

## Primeira Sessao Recomendada

Fase 3C ja foi implementada na branch `feature/workflow-engine`.

Evidencias esperadas antes de avancar:

- Pest cobrindo start/advance, branch condicional, all/quorum, rejeicao, reassignment, version pin, sandbox, depth guard e decisao tardia/duplicada
- Pint verde
- smoke HTTP de branch condicional aprovado ponta a ponta
- smoke HTTP concorrente com um `200`, um `422`, status final `approved` e `decisions_count=1`
- ADRs e progresso atualizados
- veredicto `APROVADO` do verificador
