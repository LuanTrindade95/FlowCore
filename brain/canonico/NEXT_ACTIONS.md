---
updated: 2026-06-10
owner: LuanTrindade95
status: canonico
---

# Next Actions

## Ordem Recomendada

1. Concluir auditoria independente da Fase 1 contra `docs/VISION.md`, `docs/PROGRESS.md`, `README.md`, Docker Compose, CI e o pacote operacional FlowCore.
2. Se a Fase 1 for aprovada, executar Fase 2 - Dominio e Dados:
   - lado Definition
   - lado Runtime
   - state machines
   - RBAC seed
   - factories e seeders
3. Manter uma branch por fase e commits granulares.
4. Atualizar `docs/DECISIONS.md`, `docs/PROGRESS.md` e o Brain no fechamento de cada fase.
5. Nao criar endpoints de produto antes da modelagem validada da Fase 2.

## Primeira Sessao Recomendada

Fase 1 ja foi implementada na branch `feature/platform-foundation`.

Evidencias esperadas antes de avancar:

- checks backend e frontend verdes
- Docker Compose com backend, frontend, MySQL, Redis, Horizon e Reverb validado
- nenhuma entidade de dominio criada antes da Fase 2
- ADRs e progresso atualizados
- veredicto `APROVADO` do verificador
