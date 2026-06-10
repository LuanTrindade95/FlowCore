---
updated: 2026-06-10
owner: LuanTrindade95
status: canonico
---

# Current State

## Resumo

FlowCore e uma plataforma de automacao de processos empresariais configuraveis. Empresas usam o sistema para criar e executar fluxos de solicitacao, aprovacao e operacoes internas sem alterar codigo.

## Estado Atual

O projeto esta em fase greenfield, com ideia validada e arquitetura conceitual definida.

Existe no repositorio:

- `README.md` inicial com o nome do projeto.
- `LICENSE` MIT.
- `.gitattributes`.
- Dev Brain inicial em `brain/`.
- Documentos formais iniciais em `docs/`:
  - `docs/VISION.md`
  - `docs/DECISIONS.md`
  - `docs/PROGRESS.md`

Ainda nao existe:

- Codigo-fonte da aplicacao.
- Modelagem de dominio implementavel em migrations/models.
- Arquitetura tecnica detalhada fora da visao inicial.
- Fluxos completos do produto fora do roadmap faseado.
- Documentacao de implementacao.
- Backlog tecnico.

## Contexto Confirmado

- Stack principal decidida: Angular 19, Laravel 12, MySQL, Redis e Docker.
- Arquitetura conceitual baseada em Workflow Engine configuravel.
- O sistema nao tera fluxos fixos; administradores poderao configurar etapas, aprovacoes, condicoes e transicoes pela interface.
- O projeto deve demonstrar senioridade arquitetural por meio de State Machine, Event Driven Architecture, filas, scheduler, auditoria e modelagem de dominio.
- Documentacao oficial vive em Markdown versionado no Git.
- Obsidian tambem sera usado para aprendizado, conceitos, ADRs, arquitetura, duvidas, evolucao tecnica, comparacoes entre projetos e preparacao para entrevistas.
- `docs/VISION.md` define o escopo MVP, a separacao Definition vs Runtime, o mapa de telas, riscos tecnicos e o brand kit light-first.
- O pacote externo `03-flowcore-prompts.md` esta sendo usado como roadmap operacional faseado, com auditoria a cada fase.

## Em Progresso

- Execucao auditada das fases do FlowCore a partir do pacote de prompts.
- Fase atual: Prompt 0 concluido localmente na branch `docs/flowcore-vision`.

## Bloqueios

Nenhum bloqueio tecnico registrado.

## Lacunas Conhecidas

> [!todo] A CONFIRMAR: owner oficial a ser usado no front-matter dos documentos canonicos. Valor inicial usado: `LuanTrindade95`.

> [!todo] A CONFIRMAR: modelagem implementavel de `WorkflowDefinition`, `WorkflowStep`, `WorkflowTransition`, `StepApprover`, `WorkflowInstance`, `InstanceStep`, `InstanceStepDecision` e `WorkflowAction` durante a Fase 2.
