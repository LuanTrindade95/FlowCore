---
updated: 2026-06-11
owner: LuanTrindade95
status: canonico
---

# Next Actions

## Ordem Recomendada

1. Executar Fase 6 - Polish & Vitrine:
   - revisar narrativa visual e copy do produto para portfolio senior
   - consolidar README com arquitetura, regras de negocio, setup e evidencias
   - avaliar screenshots ou fluxo demonstravel do builder/runtime
   - limpar dados/demo seed para smoke reproduzivel
   - revisar responsividade e estados vazios/erro das telas principais
2. Manter os contratos runtime da Fase 4C como autoridade para visibilidade e acoes.
3. Manter uma branch por fase e commits granulares.
4. Atualizar `docs/DECISIONS.md`, `docs/PROGRESS.md` e o Brain no fechamento de cada fase.
5. Tornar o seeder demo idempotente antes de depender de `php artisan db:seed` repetido em smoke local.

## Primeira Sessao Recomendada

Fase 5 ja foi implementada na branch `feature/realtime-automation`.

Evidencias registradas:

- Pint e Pest verdes: 38 testes backend, 144 assertions
- typecheck, lint, 25 testes Jest e build Angular verdes
- `npm audit --omit=dev` e `composer audit` sem vulnerabilidades conhecidas
- E2E local de Reverb/Echo validando request `#77` atualizado de `Pendente` para `Escalada` sem reload
- ADRs, progresso e handoff atualizados
- veredicto `APROVADO` do verificador local
