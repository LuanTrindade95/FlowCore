---
updated: 2026-06-10
owner: LuanTrindade95
status: canonico
---

# Next Actions

## Ordem Recomendada

1. Executar Fase 5 - Escalonamento, Automacoes + Realtime:
   - definir eventos de dominio e broadcasts relevantes
   - implementar jobs/scheduler de SLA e escalonamento de steps
   - atualizar inbox, detalhe e dashboard por Reverb/Echo sem polling excessivo
   - preservar idempotencia, locks e trilha de auditoria em jobs concorrentes
   - cobrir retries, falhas de broadcast e processamento duplicado
2. Manter os contratos runtime da Fase 4C como autoridade para visibilidade e acoes.
3. Manter uma branch por fase e commits granulares.
4. Atualizar `docs/DECISIONS.md`, `docs/PROGRESS.md` e o Brain no fechamento de cada fase.
5. Auditar o seeder demo antes de depender de `php artisan db:seed` repetido em smoke local.

## Primeira Sessao Recomendada

Fase 4C ja foi implementada na branch `feature/runtime-experience`.

Evidencias registradas:

- Pint e Pest verdes: 34 testes backend, 131 assertions
- typecheck, lint, 23 testes Jest e build Angular verdes
- `npm audit --omit=dev` e `composer audit` sem vulnerabilidades conhecidas
- E2E local de solicitante/aprovador validando formulario dinamico, inbox e transicao condicional
- ADRs, progresso e handoff atualizados
- veredicto `APROVADO` do verificador local
