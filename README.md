# FlowCore

FlowCore e uma plataforma empresarial de workflows configuraveis. Administradores modelam etapas, transicoes, condicoes, aprovadores e SLAs sem alterar codigo; a aplicacao executa esses fluxos por uma engine dirigida por dados.

## Stack

- Backend: Laravel 12, PHP 8.3, Sanctum, Horizon, Reverb, spatie/laravel-permission, spatie/laravel-data.
- Frontend: Angular 19 standalone, Signals, Tailwind CSS, Jest, @foblex/flow, Echo/Pusher.
- Infra: MySQL 8, Redis 7 e Docker Compose.

## Estrutura

```text
backend/   API Laravel, filas, realtime e futura engine
frontend/  SPA Angular
docker/    Dockerfiles e configuracoes de runtime
docs/      visao, ADRs e progresso por fase
brain/     contexto operacional para agentes IA
```

## Desenvolvimento

```powershell
docker compose up --build
```

Servicos locais:

- Frontend: http://localhost:4200
- Backend: http://localhost:8000
- Reverb: http://localhost:8080
- MySQL: localhost:3306
- Redis: localhost:6379

## Checks

Backend:

```powershell
cd backend
.\vendor\bin\pint --test
.\vendor\bin\pest
php artisan about
```

Frontend:

```powershell
cd frontend
npm run lint
npm test
npm run typecheck
npm run build
```

## Regras Do Projeto

- Produto em pt-BR; codigo, identificadores, colunas, rotas e eventos em ingles.
- Workflow Definition e Runtime sao dominios separados.
- Definicoes publicadas serao imutaveis.
- Cada fase precisa de evidencia empirica antes de avancar.
