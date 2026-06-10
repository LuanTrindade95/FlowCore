---
updated: 2026-06-10
owner: LuanTrindade95
status: canonico
---

# Next Actions

## Ordem Recomendada

1. Executar Fase 4C - Frontend Runtime:
   - lista e detalhe de solicitacoes
   - abertura de request baseada em definicao publicada e form schema
   - inbox com steps pendentes e decisoes
   - historico/auditoria de actions
   - estados de loading/empty/error e permissao por papel
2. Manter o builder da Fase 4B sem introduzir runtime dentro das telas administrativas.
3. Manter uma branch por fase e commits granulares.
4. Atualizar `docs/DECISIONS.md`, `docs/PROGRESS.md` e o Brain no fechamento de cada fase.
5. Auditar o seeder demo antes de depender de `php artisan db:seed` repetido em smoke local.

## Primeira Sessao Recomendada

Fase 4B ja foi implementada na branch `feature/frontend-builder`.

Evidencias registradas:

- `npm run typecheck`, `npm run lint`, Jest e build verdes
- Jest cobrindo serializacao do grafo, highlights de publish 422 e reorder/payload do form builder
- Docker frontend servindo o bundle atual em `http://localhost:4200`
- smoke Playwright de login admin, lista, builder com erro 422 e form field salvo
- ADRs e progresso atualizados
- veredicto `APROVADO` do verificador local
