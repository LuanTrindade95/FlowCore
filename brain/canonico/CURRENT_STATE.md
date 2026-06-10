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

Ainda nao existe:

- Codigo-fonte da aplicacao.
- Modelagem de dominio detalhada.
- Arquitetura tecnica detalhada.
- Fluxos completos do produto.
- Documentacao de implementacao.
- Backlog tecnico.
- Pacote de prompts de execucao.

## Contexto Confirmado

- Stack principal decidida: Angular 19, Laravel 12, MySQL, Redis e Docker.
- Arquitetura conceitual baseada em Workflow Engine configuravel.
- O sistema nao tera fluxos fixos; administradores poderao configurar etapas, aprovacoes, condicoes e transicoes pela interface.
- O projeto deve demonstrar senioridade arquitetural por meio de State Machine, Event Driven Architecture, filas, scheduler, auditoria e modelagem de dominio.
- Documentacao oficial vive em Markdown versionado no Git.
- Obsidian tambem sera usado para aprendizado, conceitos, ADRs, arquitetura, duvidas, evolucao tecnica, comparacoes entre projetos e preparacao para entrevistas.

## Em Progresso

- Bootstrap do Dev Brain do projeto.
- Preparacao da base documental para orientar modelagem de dominio, arquitetura e implementacao.

## Bloqueios

Nenhum bloqueio tecnico registrado.

## Lacunas Conhecidas

> [!todo] A CONFIRMAR: owner oficial a ser usado no front-matter dos documentos canonicos. Valor inicial usado: `LuanTrindade95`.

> [!todo] A CONFIRMAR: modelagem detalhada de `Workflow`, `Step`, `Transition`, `Condition`, `Execution` e `Approval`.

> [!todo] A CONFIRMAR: conteudo completo do brand kit citado no contexto inicial.
