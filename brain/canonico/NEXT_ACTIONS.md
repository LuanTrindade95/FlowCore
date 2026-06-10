---
updated: 2026-06-10
owner: LuanTrindade95
status: canonico
---

# Next Actions

## Ordem Recomendada

1. Executar Fase 1 - Fundacao do monorepo:
   - `/backend` Laravel 12
   - `/frontend` Angular 19
   - Docker Compose
   - CI
   - localizacao pt-BR
2. Auditar Fase 1 contra `docs/VISION.md`, `docs/PROGRESS.md` e o pacote operacional FlowCore.
3. Executar Fase 2 - Dominio e Dados:
   - lado Definition
   - lado Runtime
   - state machines
   - RBAC seed
   - factories e seeders
4. Manter uma branch por fase e commits granulares.
5. Atualizar `docs/DECISIONS.md`, `docs/PROGRESS.md` e o Brain no fechamento de cada fase.

## Primeira Sessao Recomendada

Iniciar Fase 1 somente apos o Prompt 0 estar auditado e fechado.

Saida esperada:

- monorepo com Laravel, Angular, Docker e CI
- build e checks basicos executados
- nenhuma entidade de dominio criada antes da Fase 2
- ADRs iniciais registrados
