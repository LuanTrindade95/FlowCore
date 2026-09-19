---
updated: 2026-09-19
owner: LuanTrindade95
status: canonico
---

# Known Issues

Nenhum bug funcional aberto registrado.

## Limitacoes Atuais

- Fluxos completos do produto ainda nao foram especificados.
- Backlog tecnico ainda nao foi criado.
- Staging externo esta no ar: frontend Netlify `https://flowcore-luantrindade.netlify.app`, API Render `https://flowcore-api-urkx.onrender.com`, Reverb Render `https://flowcore-reverb.onrender.com`, MySQL/Valkey Aiven no projeto `portfolio-01`.
- Os web services Render em plano free hibernam por inatividade; a primeira resposta apos hibernacao ja foi medida em 24,6 s e 84,5 s. Qualquer divulgacao do link precisa avisar sobre essa espera.
- O servico MySQL Aiven `portfolio` desliga sozinho (`Powered off`) e, enquanto desligado, seu hostname deixa de resolver em DNS. A API continua respondendo `/health` 200, mas toda rota que toca o banco retorna 500. Religar o servico no console Aiven restaura o acesso.
- O staging Render roda `QUEUE_CONNECTION=sync` sem Horizon e sem scheduler: o escalonamento de SLA (`workflow:escalate-overdue`) nao executa em staging, so em ambiente local.
- Logo apos religar o MySQL Aiven, chamadas isoladas a API podem falhar com 500 ou 520 de borda antes de estabilizar; repetir a chamada resolve. Um 500 nessa janela nao caracteriza bug de aplicacao.
- A API em staging roda `php artisan serve`, servidor de desenvolvimento de processo unico, adequado apenas para demo.
- O host Windows possui PHP 8.2.26; a referencia de runtime para PHP 8.3 e Docker/CI.
- O token frontend permanece somente em memoria por decisao de seguranca do MVP; recarregar a SPA exige novo login.
- `npm audit --omit=dev` acusa 7 vulnerabilidades (3 high) em `@angular/*` 19.2.25, ultima versao da linha 19; a correcao exige upgrade major. Enquanto nao houver decisao, `npm run fitness` termina vermelho nesse passo.
- Se `backend/.env` local existir com `DB_CONNECTION=sqlite`, o servidor HTTP Docker pode autenticar contra banco errado. Alinhar `.env` local ao `.env.example` antes de smoke HTTP.
- O versionamento imutavel da Fase 3B usa endpoint explicito `/draft`; update direto em publicado e recusado com 422.
- A tabela `instance_steps` possui apenas `assigned_to`; para steps por role/multiplos aprovadores, a Fase 3C deixa `assigned_to=null` e resolve os aprovadores dinamicamente a partir de `step_approvers` no momento da decisao.
- `ng build` com Tailwind CSS v4 ainda pode emitir um aviso de otimizacao CSS sobre uma regra base aninhada do preflight (`& -> Empty sub-selector`). O build termina com exit code 0 e o smoke Playwright confirmou CSS aplicado no Chromium.
- O ambiente de E2E local depende de usuarios demo, RBAC e workflows publicados. A seed idempotente cobre o estado demo local, mas staging publico ainda precisa de estrategia propria de dados.
- O endpoint realtime usa explicitamente a conexao `reverb`; ambientes que alterarem o nome da conexao de broadcasting devem atualizar `BroadcastAuthController`. O controller registra o canal `users.{id}.runtime` nessa conexao no momento da request; resolver `Broadcast::connection('reverb')` durante o boot quebra `artisan`/`composer install` sem `REVERB_APP_KEY`.
- O Pest emite um warning por teste (`file_get_contents(backend/.env)`) quando `backend/.env` nao existe, como no CI; nao falha a suite.
- O CI exibe annotations de deprecacao: actions em runtime Node 20 (`actions/checkout@v4`, cache) e migracao de `ubuntu-latest` para Ubuntu 26 a partir de 2026-10-19.
- Em Docker local, `backend/.env` ignorado precisa estar alinhado ao `.env.example` para `BROADCAST_CONNECTION`, `REVERB_APP_ID`, `REVERB_APP_KEY`, `REVERB_APP_SECRET` e `REVERB_BROADCAST_HOST`; caso contrario, o servidor `artisan serve` pode divergir dos processos CLI.
- O deploy externo ainda depende de plataforma, workspace, Git remoto, secrets e URLs reais aprovados pelo PO.
- `deploy/render/render.yaml.example` permanece documental; o Blueprint real aplicado e `render.yaml`.
- `render.yaml` define `LOG_CHANNEL=stderr` e `LOG_LEVEL=error` para que excecoes aparecam nos Logs do Render; sem elas o Laravel grava em arquivo dentro do container e o erro fica invisivel. O valor so vale apos novo deploy do Blueprint.
- Os testes backend via `docker compose exec` rodam contra o MySQL do compose em vez do sqlite de `phpunit.xml`, porque o `env_file` do compose precede os `<env>` do PHPUnit; rodar a suite apaga os dados demo locais.
- O banco demo resetavel e exclusivamente `flowcore_staging` no servico MySQL Aiven `portfolio`; `defaultdb` e qualquer outro banco estao fora da politica de reset.
- O runner local do `godmode-plus` foi ajustado fora do repositorio para resolver `npx` no Windows via `cmd.exe`; uma atualizacao futura da skill pode sobrescrever esse ajuste.
