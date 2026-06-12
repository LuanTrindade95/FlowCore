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

## Evidencias Versionadas

Screenshots selecionados vivem em `docs/assets/screenshots/`:

- `login-desktop.png`
- `dashboard-desktop.png`
- `workflows-desktop.png`

Essas imagens sao evidencias de portfolio, nao testes automatizados.

Galeria: [docs/assets/screenshots/README.md](assets/screenshots/README.md).
