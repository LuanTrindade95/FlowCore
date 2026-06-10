---
updated: 2026-06-10
owner: LuanTrindade95
status: canonico
---

# Known Issues

Nenhum bug funcional registrado na fundacao.

## Limitacoes Atuais

- Fluxos completos do produto ainda nao foram especificados.
- Backlog tecnico ainda nao foi criado.
- O host Windows possui PHP 8.2.26; a referencia de runtime para PHP 8.3 e Docker/CI.
- `npm audit --omit=dev` esta limpo; auditoria completa do npm ainda pode apontar vulnerabilidades em dependencias dev do toolchain Angular/Jest.
- `tinker --execute` com comandos multi-statement e variaveis teve conflito de quoting no PowerShell; smoke equivalente foi executado via bootstrap PHP dentro do container.
- Se `backend/.env` local existir com `DB_CONNECTION=sqlite`, o servidor HTTP Docker pode autenticar contra banco errado. Alinhar `.env` local ao `.env.example` antes de smoke HTTP.
