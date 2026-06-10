# VISION — FlowCore

## Visão Geral
Plataforma empresarial de workflow e aprovação onde administradores criam fluxos dinâmicos (aprovação de compras, férias, reservas, requisições) — definindo etapas, aprovadores, condições, rejeições e escalonamentos SEM alterar código. Engine de workflow dirigida por dados, construtor visual drag-and-drop, timeline de aprovação, automações e notificações. Projeto de portfólio que evidencia abstração de domínio e arquitetura de engine.

## Problema
Empresas têm processos de aprovação rígidos, codificados ou tocados por e-mail/planilha. Mudar um fluxo exige TI. FlowCore permite que o próprio negócio modele e altere fluxos via interface, com rastreabilidade e automação.

## Princípio arquitetural central
O fluxo é DADO, não código. O motor lê definições (etapas + transições + condições) do banco e as executa. Adicionar/alterar um fluxo NÃO requer deploy. O que é fixo em código: o ciclo de vida da instância e do step (máquinas de estado pequenas); a engine que traversa o grafo; o avaliador de condições.

## Escopo do MVP
DENTRO: auth + RBAC; construtor de workflow (etapas, transições, condições, aprovadores, SLA) com versionamento e publicação; construtor de formulário por fluxo; runtime (abrir requisição, motor avança, decisões approve/reject/reassign/comment, modos any/all/quorum); condições dinâmicas; escalonamento por SLA; automações (auto-aprovar/rejeitar/notificar); timeline/histórico; notificações; realtime na caixa de tarefas.
FORA (v2): integrações externas, BPMN import/export, SLA por calendário de feriados, sub-workflows aninhados.

## Stack Técnica
| Camada | Tecnologia | Justificativa |
|---|---|---|
| Backend | Laravel 12 / PHP 8.3 | Engine, jobs, scheduler |
| API | REST versionada /api/v1 + API Resources | Contrato estável p/ SPA |
| Auth | Sanctum (SPA token) | Padrão SPA + Laravel |
| RBAC | spatie/laravel-permission | admin, manager/approver, requester |
| Condições | symfony/expression-language (sandbox) | Avaliar regras sem eval, com segurança |
| Estado (instância/step) | máquina de estados fixa pequena (state pattern) | Ciclos fixos; o grafo é dado |
| DTOs | spatie/laravel-data | Tipagem entre camadas |
| Banco | MySQL 8 | Relacional, transações |
| Cache/Filas | Redis + Laravel Queue/Horizon + Scheduler | Automações, escalonamento, notificações |
| Realtime | Laravel Reverb + Echo | Caixa de tarefas e timeline ao vivo |
| Frontend | Angular 19 (standalone, signals) | Builder, forms dinâmicos |
| Builder visual | @foblex/flow (recomendado) / ngx-graph / CDK+SVG | Editor de fluxo node-based |
| Estilização | TailwindCSS (light-first) | Brand kit (abaixo) |
| Testes | Pest (back) · Jest + Playwright (front) | Funcional + E2E |
| Infra | Docker Compose | Sobe stack inteira |

## Entidades de Domínio
### Lado DEFINIÇÃO (templates)
- **WorkflowDefinition**: name, slug, description, version(int), status(draft|published|archived), category. Publicada = imutável.
- **WorkflowStep**: definition_id, key, name, type(approval|task|notification|automation|condition), order, config(json), sla_hours?, is_start(bool).
- **StepApprover**: step_id, assignee_type(user|role|dynamic ex 'requester_manager'), assignee_ref, approval_mode(any|all|quorum), quorum_n?.
- **WorkflowTransition**: definition_id, from_step_id, to_step_id, on_event(approved|rejected|completed|condition), condition_expression?(string p/ expression-language).
- **FormField**: definition_id, key, label, type(text|number|select|date|textarea|bool), required(bool), options(json), order.

### Lado RUNTIME (instâncias)
- **WorkflowInstance**: definition_id, definition_version, requester_id, status(running|approved|rejected|cancelled|completed), current_step_id?, data(json: valores do formulário), started_at, finished_at.
- **InstanceStep**: instance_id, step_id, status(pending|in_progress|approved|rejected|skipped|escalated|completed), assigned_to?, approval_mode, decisions_needed, decisions_count, due_at?, completed_at?.
- **InstanceStepDecision**: instance_step_id, actor_id, decision(approve|reject), comment?, created_at. (suporta modo all/quorum)
- **WorkflowAction** (timeline): instance_id, instance_step_id?, actor_id?, action(submitted|approved|rejected|reassigned|commented|escalated|auto_advanced|cancelled), payload(json), created_at.

## A Engine (núcleo — fixo em código)
WorkflowEngine.start(definition, requester, data): valida data contra FormField, cria Instance (presa à version atual), resolve e ativa o step inicial (cria InstanceStep + assignees).
WorkflowEngine.decide(instanceStep, actor, decision, comment): registra InstanceStepDecision; avalia se o step fecha conforme approval_mode (any=1, all=todos, quorum=N); se fecha, dispara evento e chama advance().
WorkflowEngine.advance(instance, fromStep, event): seleciona WorkflowTransitions de fromStep cujo on_event casa e cuja condition_expression (avaliada via expression-language sobre instance.data) é verdadeira; ativa o(s) próximo(s) step(s); se não há próximo, marca instância terminal. Tudo em transação; cada passo registra WorkflowAction.

## Validação de grafo (na publicação — registrar ADR)
Ao publicar: exatamente 1 step is_start; todo step alcançável a partir do start; todo caminho leva a um terminal; sem transição órfã; condição com sintaxe válida. Falha → 422 com lista de erros. Publicação incrementa version e congela a definição.

## Mapa de funcionalidades
Core: auth/RBAC · builder de workflow (drag-drop) · builder de formulário · publicação+versionamento · abrir requisição · engine (avançar/condições/assignees) · decisões (approve/reject/reassign/comment any/all/quorum) · timeline · escalonamento SLA · automações · notificações · realtime na inbox.
Importante: filtros persistentes na URL · caixa "minhas pendências" · histórico por instância.
Nice-to-have: dashboard de gargalos · clonar fluxo · simular fluxo.

## Mapa de telas
/login · /dashboard (KPIs: pendentes, atrasados, throughput) · /admin/workflows (lista + builder) · /admin/workflows/:id/builder (canvas drag-drop) · /admin/workflows/:id/form (form builder) · /requests/new (escolhe workflow → form dinâmico) · /requests/:id (timeline + estado) · /inbox (minhas aprovações pendentes) · /requests (lista + filtros).

## Brand kit (frontend — LIGHT-FIRST)
Cores: Graphite #111827, Process Blue #2563EB, Emerald Flow #10B981; Surface #F9FAFB, Neutral #D1D5DB, Soft Blue #93C5FD; Success #22C55E, Warning #F59E0B, Danger #DC2626. Fontes: Inter (principal), Manrope (display). Estilo: enterprise moderno, orientado a processos, nós/conexões visuais, grids organizacionais, leitura rápida de fluxos. Referências: ServiceNow, Pipefy, Jira Automation, Camunda, Monday Enterprise.

## Riscos técnicos
- Engine de grafo dinâmico (transições/condições) — risco principal; mitigar com testes ponta a ponta cobrindo branch condicional, quorum e rejeição.
- Avaliação de condição insegura — mitigar com sandbox do expression-language + teste de expressão maliciosa.
- Versionamento/imutabilidade — instância em curso não pode mudar se a definição for editada; mitigar com pin de version + teste.
- Loop infinito no grafo (ciclo sem saída) — mitigar com validação de grafo + guarda de profundidade na engine.
- Concorrência de decisão (dois aprovadores ao mesmo tempo em modo quorum) — mitigar com transação + lock.

## Localização (pt-BR)
Idioma do produto: português (Brasil). Locale ÚNICO pt-BR (sem biblioteca de i18n). Toda string de UI, validação, exceção, e-mail e notificação em pt-BR.
- CÓDIGO EM INGLÊS: identificadores (variáveis, funções, classes, tabelas, colunas, rotas, eventos), nomes de arquivo e comentários ficam em inglês. Só conteúdo do usuário final em pt-BR. NÃO usar português em nomes de código nem de coluna.
- ENUMS em inglês no banco (ex.: pending/approved); rótulo pt-BR só na apresentação (mapa de labels no frontend).
- FORMATAÇÃO: backend devolve dados neutros (datas ISO 8601, números crus); o frontend formata com locale pt-BR (R$/BRL, dd/mm/aaaa, separadores).
- Backend (Laravel): config/app.php locale 'pt_BR', fallback_locale 'en', faker_locale 'pt_BR', timezone 'America/Sao_Paulo'; instalar laravel-lang/lang (pt_BR) para validação/auth; exceções e notificações em pt-BR; seeds com Faker pt_BR.
- Frontend (Angular): LOCALE_ID 'pt-BR', registerLocaleData(localePt), DEFAULT_CURRENCY_CODE 'BRL'; pipes date/currency/number com pt-BR; máscaras (telefone/CPF/CNPJ/moeda) via ngx-mask; strings de UI centralizadas. Registrar ADR de localização.
