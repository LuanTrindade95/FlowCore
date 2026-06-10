---
updated: 2026-06-10
owner: LuanTrindade95
status: canonico
---

# Next Actions

## Ordem Recomendada

1. Concluir auditoria da Fase 3B contra `docs/VISION.md`, `docs/PROGRESS.md`, rotas API, GraphValidator, testes e smoke HTTP.
2. Se a Fase 3B for aprovada, executar Fase 3C - Backend Workflow Engine:
   - ConditionEvaluator sandbox
   - AssigneeResolver
   - WorkflowEngine start/decide/advance
   - endpoints de requests/inbox/decisions
   - testes funcionais de branch, quorum, rejeicao, sandbox e concorrencia
3. Manter uma branch por fase e commits granulares.
4. Atualizar `docs/DECISIONS.md`, `docs/PROGRESS.md` e o Brain no fechamento de cada fase.
5. Nao implementar engine, builder ou runtime antes das fases especificas.

## Primeira Sessao Recomendada

Fase 3B ja foi implementada na branch `feature/workflow-definition-api`.

Evidencias esperadas antes de avancar:

- Pest cobrindo publish valido, imutabilidade, orfao, sem start, condicao invalida e clone draft
- Pint verde
- smoke HTTP de montar fluxo simples, publicar e recusar edicao de publicado
- ADRs e progresso atualizados
- veredicto `APROVADO` do verificador
