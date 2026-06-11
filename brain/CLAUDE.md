# Instrucoes Para Agentes IA

Este arquivo define como agentes de IA devem trabalhar no FlowCore.

## Contexto Do Projeto

FlowCore e uma plataforma de automacao de processos empresariais configuraveis. Empresas usam o sistema para criar e executar fluxos de solicitacao, aprovacao e operacoes internas sem alterar codigo.

O projeto ja possui implementacao full stack validada localmente ate a Fase 6 do build-loop, com backend Laravel, frontend Angular, Workflow Engine configuravel, runtime operacional, realtime e seed demo idempotente.

## Hierarquia De Confianca

Leia nesta ordem antes de qualquer implementacao:

1. `brain/canonico/CURRENT_STATE.md`
2. `brain/context/01_SYSTEM_OVERVIEW.md`
3. `brain/canonico/DECISIONS.md`
4. `brain/canonico/NEXT_ACTIONS.md`
5. Arquivos em `brain/architecture` e `brain/product` conforme a tarefa

Se houver conflito entre documentos, `brain/canonico` vence. Se o Brain divergir do codigo, investigue e atualize o Brain no encerramento da tarefa.

## Como Trabalhar Neste Projeto

- Trate o FlowCore como um projeto de portfolio senior, com foco em arquitetura, produto, UX, escalabilidade e credibilidade tecnica.
- Antes de implementar, identifique o dominio afetado e procure decisoes existentes no Brain.
- Prefira solucoes que demonstrem maturidade: modelagem de dominio clara, eventos, filas, auditoria, estado explicito e organizacao modular.
- Evite CRUD generico. Toda funcionalidade deve carregar regra de negocio real.
- Nao invente requisitos. Quando faltar informacao, registre `A CONFIRMAR` no arquivo adequado e em `brain/PENDING_UPDATES.md`.
- Nao misture alteracoes de documentacao, arquitetura e implementacao sem motivo claro.
- Preserve nomes de arquivos, pastas, variaveis e termos tecnicos em ingles.

## O Que Nao Fazer

- Nao assumir modelagem de dominio sem documentar a decisao.
- Nao criar fluxo fixo de aprovacao; o produto deve manter o principio de Workflow Engine configuravel.
- Nao reduzir o projeto a telas CRUD.
- Nao criar abstracoes sem pressao real do dominio.
- Nao deixar documentacao essencial com placeholders genericos.
- Nao encerrar uma tarefa estrutural sem atualizar o Brain.

## Governanca Do Brain

**Uma tarefa so termina quando o Brain reflete o que mudou.**

### Checklist De Encerramento

Antes de encerrar qualquer sessao:

1. Atualize `brain/canonico/CURRENT_STATE.md` com o estado real mais recente.
2. Atualize `brain/canonico/NEXT_ACTIONS.md` se a ordem de trabalho mudou.
3. Registre novas decisoes em `brain/canonico/DECISIONS.md`.
4. Crie ADR detalhado em `brain/decisions` quando a decisao impactar arquitetura, dominio, dados, seguranca ou operacao.
5. Registre bugs, limitacoes e riscos em `brain/canonico/KNOWN_ISSUES.md`.
6. Remova ou processe itens resolvidos de `brain/PENDING_UPDATES.md`.

### Fila De Pendencias

Quando uma informacao nao puder ser confirmada durante a tarefa:

1. Marque a lacuna no documento com `> [!todo] A CONFIRMAR: ...`.
2. Adicione uma linha correspondente em `brain/PENDING_UPDATES.md`.
3. Continue a tarefa se a lacuna nao bloquear a implementacao.

Nenhuma sessao deve depender de memoria de chat para recuperar pendencias.

### Commit Do Brain

Mudancas exclusivas no Brain devem entrar em commits `docs: ...`.

Para o bootstrap inicial, use:

```text
docs(brain): inicializa Dev Brain do projeto
```

Commits futuros devem ser pequenos, rastreaveis e focados no conhecimento alterado.
