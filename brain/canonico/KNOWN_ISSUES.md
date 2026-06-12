---
updated: 2026-06-12
owner: LuanTrindade95
status: canonico
---

# Known Issues

Nenhum bug funcional aberto registrado nas fases concluidas ate a Fase 7.

## Limitacoes Atuais

- Fluxos completos do produto ainda nao foram especificados.
- Backlog tecnico ainda nao foi criado.
- Deploy publico/staging real ainda nao foi provisionado por decisao do PO.
- O host Windows possui PHP 8.2.26; a referencia de runtime para PHP 8.3 e Docker/CI.
- O token frontend permanece somente em memoria por decisao de seguranca do MVP; recarregar a SPA exige novo login.
- `npm audit --omit=dev` esta limpo; auditoria completa do npm ainda pode apontar vulnerabilidades em dependencias dev do toolchain Angular/Jest.
- Se `backend/.env` local existir com `DB_CONNECTION=sqlite`, o servidor HTTP Docker pode autenticar contra banco errado. Alinhar `.env` local ao `.env.example` antes de smoke HTTP.
- O versionamento imutavel da Fase 3B usa endpoint explicito `/draft`; update direto em publicado e recusado com 422.
- A tabela `instance_steps` possui apenas `assigned_to`; para steps por role/multiplos aprovadores, a Fase 3C deixa `assigned_to=null` e resolve os aprovadores dinamicamente a partir de `step_approvers` no momento da decisao.
- `ng build` com Tailwind CSS v4 ainda pode emitir um aviso de otimizacao CSS sobre uma regra base aninhada do preflight (`& -> Empty sub-selector`). O build termina com exit code 0 e o smoke Playwright confirmou CSS aplicado no Chromium.
- O ambiente de E2E local depende de usuarios demo, RBAC e workflows publicados. A seed idempotente cobre o estado demo local, mas staging publico ainda precisa de estrategia propria de dados.
- O endpoint realtime usa explicitamente a conexao `reverb`; ambientes que alterarem o nome da conexao de broadcasting devem atualizar `BroadcastAuthController`.
- Em Docker local, `backend/.env` ignorado precisa estar alinhado ao `.env.example` para `BROADCAST_CONNECTION`, `REVERB_APP_ID`, `REVERB_APP_KEY`, `REVERB_APP_SECRET` e `REVERB_BROADCAST_HOST`; caso contrario, o servidor `artisan serve` pode divergir dos processos CLI.
- O frontend ainda usa `http://localhost:8000/api/v1` em `frontend/src/app/core/api/api-base-url.ts`; deploy externo exige parametrizacao por ambiente.
- O frontend ainda usa configuracao local de Reverb em `frontend/src/app/core/realtime/realtime.config.ts`; deploy externo exige parametrizacao por ambiente.
- O runner local do `godmode-plus` foi ajustado fora do repositorio para resolver `npx` no Windows via `cmd.exe`; uma atualizacao futura da skill pode sobrescrever esse ajuste.
