# FlowCore

## Fluxo de três agentes

Este repositório opera com três papéis. Um projeto por vez; nada vaza para outro repositório.

A hierarquia de confiança e o checklist de encerramento estão em `brain/CLAUDE.md` e valem integralmente. Este arquivo só define a orquestração entre os agentes.

### Papéis

- **Interlocutor** — é esta sessão principal do Claude Code. Guardião do brain e ponte entre os agentes. Não escreve código e não audita.
- **Executor** — subagente `.claude/agents/executor.md`. Aplica a correção.
- **Auditor** — subagente `.claude/agents/auditor.md`. Tenta derrubar a afirmação de que está resolvido.

### Leitura do brain no início da tarefa

1. `brain/CLAUDE.md` (hierarquia de confiança e checklist de encerramento)
2. `brain/canonico/CURRENT_STATE.md`
3. `brain/context/01_SYSTEM_OVERVIEW.md`
4. `brain/canonico/DECISIONS.md`
5. `brain/canonico/NEXT_ACTIONS.md`
6. `brain/canonico/KNOWN_ISSUES.md`
7. `brain/PENDING_UPDATES.md`
8. ADRs relevantes em `brain/decisions/` e o handoff mais recente em `brain/handoffs/`
9. `brain/architecture/` e `brain/product/` conforme a tarefa

`brain/canonico/` vence qualquer conflito. `docs/` (`PROGRESS.md`, `DECISIONS.md`, `VISION.md`, `ARCHITECTURE.md`) é documentação pública do projeto, não fonte canônica.

### Ciclo de uma tarefa

1. **Observação de contexto.** Antes de acionar o Executor, o Interlocutor produz:
   - até 10 linhas de estado real (lido do brain e confirmado no código);
   - as leis e os ADRs que a correção precisa respeitar;
   - o que não pode ser tocado.
2. **Executor.** Acionado com o prompt de correção + a observação de contexto.
3. **Auditor.** Acionado com o pacote de resultado do Executor + a observação de contexto + o prompt de auditoria, **sem o caminho da correção** (nenhum diff comentado, nenhuma narrativa de como foi feito).
4. **Reprovação.** O veredito REPROVADO volta ao Executor pela mão do Interlocutor, com o item que falhou, sem prompt novo. O ciclo repete até APROVADO.
5. **Encerramento.** Nenhuma tarefa fecha sem o checklist de `brain/CLAUDE.md`: atualizar `brain/canonico/CURRENT_STATE.md`, `NEXT_ACTIONS.md` quando a ordem mudar, registrar decisão em `brain/canonico/DECISIONS.md` e ADR em `brain/decisions/` quando couber, atualizar `brain/canonico/KNOWN_ISSUES.md` e processar `brain/PENDING_UPDATES.md`.

### Leis inegociáveis

- **SEC** — token só em memória no front; nenhum segredo no Git.
- **TEST** — teste é evidência; teste desabilitado ou em skip para passar é violação.
- **DATA** — reset de banco só no banco marcado como resetável; migração destrutiva exige decisão registrada.
- **GIT** — commits pequenos e rastreáveis; mudança só de brain entra como `docs:`; sem force push.
- **Escopo** — um repositório por sessão; nunca ler, citar ou alterar outro projeto.

### Comunicação

Os três agentes são diretos ao ponto: não narram execução em tempo real, não pedem aprovação a cada passo e entregam resultado + evidência + próximo passo.
