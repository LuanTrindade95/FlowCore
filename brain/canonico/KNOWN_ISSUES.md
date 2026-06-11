---
updated: 2026-06-11
owner: LuanTrindade95
status: canonico
---

# Known Issues

Nenhum bug funcional aberto registrado nas fases concluidas ate a Fase 5.

## Limitacoes Atuais

- Fluxos completos do produto ainda nao foram especificados.
- Backlog tecnico ainda nao foi criado.
- O host Windows possui PHP 8.2.26; a referencia de runtime para PHP 8.3 e Docker/CI.
- O token frontend permanece somente em memoria por decisao de seguranca do MVP; recarregar a SPA exige novo login.
- `npm audit --omit=dev` esta limpo; auditoria completa do npm ainda pode apontar vulnerabilidades em dependencias dev do toolchain Angular/Jest.
- `tinker --execute` com comandos multi-statement e variaveis teve conflito de quoting no PowerShell; smoke equivalente foi executado via bootstrap PHP dentro do container.
- Se `backend/.env` local existir com `DB_CONNECTION=sqlite`, o servidor HTTP Docker pode autenticar contra banco errado. Alinhar `.env` local ao `.env.example` antes de smoke HTTP.
- `php artisan db:seed` nao e idempotente quando os workflows demo ja existem; o `DemoWorkflowSeeder` tenta inserir slug/version duplicados. Usar `migrate:fresh --seed` para reset completo ou tornar o seeder idempotente em fase de hardening.
- O versionamento imutavel da Fase 3B usa endpoint explicito `/draft`; update direto em publicado e recusado com 422.
- A tabela `instance_steps` possui apenas `assigned_to`; para steps por role/multiplos aprovadores, a Fase 3C deixa `assigned_to=null` e resolve os aprovadores dinamicamente a partir de `step_approvers` no momento da decisao.
- `ng build` com Tailwind CSS v4 ainda pode emitir um aviso de otimizacao CSS sobre uma regra base aninhada do preflight (`& -> Empty sub-selector`). O build termina com exit code 0 e o smoke Playwright confirmou CSS aplicado no Chromium.
- O ambiente de E2E local depende de usuarios demo, RBAC e workflows publicados. Antes da Fase 6, consolidar um comando idempotente de seed para staging local.
- O endpoint realtime usa explicitamente a conexao `reverb`; ambientes que alterarem o nome da conexao de broadcasting devem atualizar `BroadcastAuthController`.
- Em Docker local, `backend/.env` ignorado precisa estar alinhado ao `.env.example` para `BROADCAST_CONNECTION`, `REVERB_APP_ID`, `REVERB_APP_KEY`, `REVERB_APP_SECRET` e `REVERB_BROADCAST_HOST`; caso contrario, o servidor `artisan serve` pode divergir dos processos CLI.
