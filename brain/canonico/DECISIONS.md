---
updated: 2026-06-10
owner: LuanTrindade95
status: canonico
---

# Decisions

Log cronologico resumido das decisoes confirmadas.

## 2026-06-10 - Stack principal

Decisao: usar Angular 19, Laravel 12, MySQL, Redis e Docker.

Por que: a stack permite demonstrar arquitetura full stack moderna, backend robusto, frontend escalavel, persistencia relacional, cache/filas e ambiente reprodutivel.

## 2026-06-10 - Workflow Engine configuravel

Decisao: o FlowCore sera baseado em uma Workflow Engine configuravel, sem fluxos fixos hardcoded.

Por que: o diferencial do produto e permitir que administradores criem etapas, aprovacoes, condicoes e transicoes pela interface, sem alterar codigo.

## 2026-06-10 - Projeto como vitrine de senioridade arquitetural

Decisao: o projeto deve demonstrar State Machine, Event Driven Architecture, filas, scheduler, auditoria e modelagem de dominio.

Por que: o objetivo do FlowCore nao e apenas resolver aprovacoes; ele deve comunicar maturidade tecnica, produto empresarial e capacidade de projetar sistemas escalaveis.

## 2026-06-10 - Markdown + Git com apoio de Obsidian

Decisao: documentacao oficial sera versionada no Git em Markdown, com Obsidian usado como apoio de aprendizado e navegacao.

Por que: Markdown + Git garantem portabilidade, diff e rastreabilidade. Obsidian melhora navegacao humana, backlinks e organizacao conceitual sem virar dependencia obrigatoria do projeto.

## 2026-06-10 - VISION como fonte formal inicial

Decisao: criar `docs/VISION.md`, `docs/DECISIONS.md` e `docs/PROGRESS.md` como documentos formais iniciais do FlowCore.

Por que: o projeto precisa de uma fonte versionada para escopo, stack, separacao Definition vs Runtime, riscos tecnicos, fases e ADRs antes de iniciar codigo de aplicacao.

## 2026-06-10 - Roadmap operacional por fases auditadas

Decisao: usar o pacote operacional FlowCore como guia faseado de execucao, com auditoria por fase antes de avancar.

Por que: o FlowCore tem alto risco arquitetural na engine de workflow; dividir em fases com evidencias evita conclusoes apenas estruturais e protege consistencia de portfolio.
