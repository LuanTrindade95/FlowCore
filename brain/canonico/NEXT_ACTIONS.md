---
updated: 2026-09-20
owner: LuanTrindade95
status: canonico
---

# Next Actions

## Ordem Recomendada

1. Definir o backlog tecnico pos-Fase 9, usando `brain/canonico/KNOWN_ISSUES.md` como entrada.
2. Planejar o upgrade major do Angular para encerrar as advisories aceitas em `ADR-020` e devolver `npm run fitness` ao verde.
3. Corrigir o isolamento da suite backend: `docker compose exec` roda os testes contra o MySQL do compose em vez do sqlite de `phpunit.xml`, apagando os dados demo locais.
4. Antes de divulgar a URL publica, confirmar que o MySQL Aiven `portfolio` esta `Running` e aquecer `flowcore-api` e `flowcore-reverb` com um `GET /health`.
5. Avaliar como reduzir o impacto da hibernacao do plano free na primeira visita: aviso na tela de login, aquecimento agendado ou mudanca de plano.
6. Manter seed demo idempotente como base obrigatoria de qualquer E2E local ou staging.
7. Atualizar `docs/DECISIONS.md`, `docs/PROGRESS.md` e o Brain no fechamento de cada fase.

## Estado Atual

Fase 9 concluida. Staging externo no ar e validado de fora.

Superficies publicas:

- Frontend Netlify: `https://flowcore-luantrindade.netlify.app`
- API Render: `https://flowcore-api-urkx.onrender.com`
- Reverb Render: `https://flowcore-reverb.onrender.com`
- Dados: MySQL Aiven `flowcore_staging` e Valkey Aiven `flowcore-valkey`, no projeto `portfolio-01`

Evidencias registradas:

- Smoke externo completo em 2026-09-19 e reproduzido por auditoria independente em 2026-09-20: login 200, criacao de solicitacao 201, payload fora do schema 422, inbox 200, decisao 200 com avanco de step, evento `runtime.workflow.updated` recebido em canal privado sem refresh
- Veredito `APROVADO` da auditoria adversarial, com ressalvas de divulgacao registradas em `brain/canonico/KNOWN_ISSUES.md`
- `npm run guard:migrations` e `npm run check:enforcement` verdes; `npm --prefix frontend run build:staging` verde
- `npm run fitness` vermelho apenas no passo `audit`, conforme `ADR-020`
