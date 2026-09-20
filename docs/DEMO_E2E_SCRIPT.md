# Demo E2E Script

Este roteiro descreve a demonstracao local oficial do FlowCore para portfolio.

## Pre-condicoes

- Stack local em execucao com `docker compose up -d --build`.
- Banco migrado e seed demo aplicada:

```powershell
docker compose exec -T backend php artisan migrate --force
docker compose exec -T backend php artisan db:seed --force
```

- Frontend acessivel em `http://localhost:4200`.
- Backend acessivel em `http://localhost:8000`.
- Reverb acessivel em `http://localhost:8080`.

## Contas

Todas usam senha `password`.

| Perfil | E-mail |
|---|---|
| Admin | `admin@demo.com` |
| Aprovador | `approver@demo.com` |
| Solicitante | `requester@demo.com` |

## Roteiro Principal

1. Acessar `http://localhost:4200/login`.
   - Esperado: tela apresenta FlowCore como demo tecnica e lista contas demo no desktop.

2. Entrar como `admin@demo.com`.
   - Esperado: Dashboard carrega com metricas operacionais.

3. Abrir `Workflows`.
   - Esperado: lista mostra `Aprovacao de Compra` e `Pedido de Ferias` publicados.

4. Abrir o builder de `Aprovacao de Compra`.
   - Esperado: canvas exibe steps e transitions do workflow.

5. Sair e entrar como `requester@demo.com`.
   - Esperado: usuario sem permissoes administrativas nao acessa builder.

6. Criar uma nova request de compra com valor acima de `1000`.
   - Esperado: formulario dinamico valida campos obrigatorios e cria instancia.

7. Sair e entrar como `approver@demo.com`.
   - Esperado: Inbox mostra a pendencia acionavel.

8. Aprovar a pendencia.
   - Esperado: timeline recebe acao de aprovacao e instancia avanca para o proximo step.

9. Conferir Dashboard.
   - Esperado: indicadores refletem requests visiveis ao usuario.

## Roteiro Realtime/SLA

1. Identificar uma request aberta com step pendente.
2. Manipular `due_at` localmente ou usar fixture/teste controlado.
3. Executar:

```powershell
docker compose exec -T backend php artisan workflow:escalate-overdue
```

4. Manter Inbox aberta no navegador.
   - Esperado: status muda para escalado sem reload manual.

## Stop Criteria

Parar a demo se ocorrer qualquer item:

- erro 500 no backend;
- erro de console no browser;
- usuario ve dados fora de seu perfil;
- workflow publicado some da lista;
- realtime exige refresh manual no roteiro de SLA;
- seed duplicar usuarios, workflows ou instancias demo.

## Roteiro Externo (Staging)

Este roteiro executa o mesmo fluxo de ponta a ponta contra as URLs publicas de staging, sem depender de `docker compose`.

URLs:

| Servico | URL |
|---|---|
| Frontend (Netlify) | `https://flowcore-luantrindade.netlify.app` |
| API (Render) | `https://flowcore-api-urkx.onrender.com` |
| Reverb (Render) | `wss://flowcore-reverb.onrender.com:443` |

O roteiro de escalonamento de SLA (`workflow:escalate-overdue`) **nao se aplica** a este ambiente: o Render free tier roda `QUEUE_CONNECTION=sync` e nao provisiona worker/scheduler dedicado, entao nao ha execucao periódica do comando de escalonamento em staging.

Passos:

1. `GET https://flowcore-api-urkx.onrender.com/health`.
   - Esperado: `200` com `{"status":"ok","service":"flowcore-api"}`.
   - Atencao: o primeiro acesso apos um periodo ocioso pode levar de ~25 s a mais de 1 min por spin-down do plano free do Render; repetir a chamada apos o primeiro sucesso deve responder em menos de 1 s.

2. `GET https://flowcore-luantrindade.netlify.app/config.json`.
   - Esperado: `200` com `apiBaseUrl` apontando para `https://flowcore-api-urkx.onrender.com/api/v1` e `realtime.wsHost` apontando para `flowcore-reverb.onrender.com` (porta `443`, `forceTls: true`).

3. Login como `requester@demo.com` (senha `password`):

   ```bash
   curl -s -X POST https://flowcore-api-urkx.onrender.com/api/v1/auth/login \
     -H "Content-Type: application/json" -H "Accept: application/json" \
     -d '{"email":"requester@demo.com","password":"password"}'
   ```

   - Esperado: `200` com `access_token`.

4. Buscar o schema do workflow `Aprovacao de Compra` publicado e criar uma solicitacao de compra com valor acima de `1000`:

   ```bash
   curl -s https://flowcore-api-urkx.onrender.com/api/v1/runtime/workflows/<id-de-aprovacao-de-compra> \
     -H "Authorization: Bearer <token-do-requester>" -H "Accept: application/json"

   curl -s -X POST https://flowcore-api-urkx.onrender.com/api/v1/requests \
     -H "Authorization: Bearer <token-do-requester>" \
     -H "Content-Type: application/json" -H "Accept: application/json" \
     -d '{"workflow_definition_id": <id-de-aprovacao-de-compra>, "data": {"amount": 1500, "supplier": "Fornecedor Demo", "cost_center": "Tecnologia"}}'
   ```

   - O schema do formulario publicado (`GET /api/v1/runtime/workflows/<id>`) define exatamente os campos `amount` (number), `supplier` (text) e `cost_center` (select: `Tecnologia`, `Operacoes` ou `Financeiro`), todos obrigatorios. Enviar qualquer campo fora dessa lista retorna `422` com `{"errors":{"data":["O formulario contem campos que nao pertencem a definicao publicada."]}}`.
   - Esperado com o payload correto: `201` (o Laravel atribui automaticamente o status `201` a um `JsonResource` retornado por uma rota `POST`) com a instancia criada, `status: running` e o primeiro step (`manager_approval`, `assignee_type: dynamic` / `assignee_ref: requester_manager`) pendente e resolvido para o aprovador demo.

5. Login como `approver@demo.com` (senha `password`) e conferir `GET /api/v1/inbox`.
   - Esperado: `200` com a pendencia da solicitacao criada no passo 4 na lista (o aprovador dinamico do primeiro step e resolvido automaticamente para um usuario com role `approver`).

6. Aprovar a pendencia pelo endpoint real de decisao:

   ```bash
   curl -s -X POST "https://flowcore-api-urkx.onrender.com/api/v1/requests/<workflow_instance_id>/steps/<instance_step_id>/decide" \
     -H "Authorization: Bearer <token-do-approver>" \
     -H "Content-Type: application/json" -H "Accept: application/json" \
     -d '{"decision":"approve"}'
   ```

   - Esperado: `200` com a instancia avancando de step.

7. Inbox atualizando em realtime sem refresh: um cliente do aprovador se inscreve no canal privado `private-users.{id}.runtime` via Reverb (`wss://flowcore-reverb.onrender.com:443`), autenticando em `POST https://flowcore-api-urkx.onrender.com/api/broadcasting/auth` com `Authorization: Bearer <token-do-approver>`.
   - Esperado: ao repetir o passo 4 (nova solicitacao do requester), o cliente inscrito recebe o evento `runtime.workflow.updated` (classe `App\Events\RuntimeWorkflowUpdated`) no canal do aprovador, sem reload manual.

## Stop Criteria (Roteiro Externo)

Parar o roteiro externo se ocorrer qualquer item:

- qualquer resposta `5xx`;
- `401`/`403` inesperado (fora do esperado em `GET /api/v1/runtime/workflows` sem token);
- CORS bloqueado a partir da origem do Netlify;
- evento realtime nao recebido pelo cliente inscrito no canal privado.

## Evidencias Versionadas

Screenshots selecionados vivem em `docs/assets/screenshots/`:

- `login-desktop.png`
- `dashboard-desktop.png`
- `workflows-desktop.png`

Essas imagens sao evidencias de portfolio, nao testes automatizados.

Galeria: [docs/assets/screenshots/README.md](assets/screenshots/README.md).
