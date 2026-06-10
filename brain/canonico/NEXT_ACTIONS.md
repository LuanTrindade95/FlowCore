---
updated: 2026-06-10
owner: LuanTrindade95
status: canonico
---

# Next Actions

## Ordem Recomendada

1. Concluir auditoria da Fase 2 contra `docs/VISION.md`, `docs/PROGRESS.md`, migrations, models, seeders e testes.
2. Se a Fase 2 for aprovada, executar Fase 3A - Backend Auth + RBAC:
   - Sanctum login/logout/me
   - formato JSON padrao de erro
   - policies baseadas em permissions
   - API Resource de usuario sem hash
3. Manter uma branch por fase e commits granulares.
4. Atualizar `docs/DECISIONS.md`, `docs/PROGRESS.md` e o Brain no fechamento de cada fase.
5. Nao implementar engine, builder ou runtime antes das fases especificas.

## Primeira Sessao Recomendada

Fase 2 ja foi implementada na branch `feature/domain-data-model`.

Evidencias esperadas antes de avancar:

- `php artisan migrate:fresh --seed` no MySQL Docker verde
- Pest cobrindo state machines validas/invalidas e permissao requester
- smoke de transicao valida/invalida no runtime real
- ADRs e progresso atualizados
- veredicto `APROVADO` do verificador
