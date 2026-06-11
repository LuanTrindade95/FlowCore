# Architecture Decision Records (ADR)

Cada decisao arquitetural relevante deve virar uma entrada no formato `## ADR-NN - titulo`, contendo `Contexto`, `Decisao` e `Consequencias`.

## ADR-01 - Monorepo com backend, frontend e infra versionados juntos

### Contexto

O FlowCore precisa demonstrar um produto full stack empresarial, com API Laravel, SPA Angular, realtime, filas, banco relacional, cache e ambiente local reproduzivel.

### Decisao

Usar um monorepo com:

- `backend/` para Laravel 12.
- `frontend/` para Angular 19.
- `docker/` e `docker-compose.yml` para runtime local.
- `.github/workflows/ci.yml` para checks basicos de backend e frontend.

### Consequencias

- Facilita revisao de mudancas full stack por fase.
- Mantem setup de portfolio mais simples para avaliacao tecnica.
- Exige disciplina para nao misturar escopos grandes no mesmo commit.

## ADR-02 - Docker Compose como ambiente local de referencia

### Contexto

O ambiente local Windows possui PHP 8.2.26, enquanto a stack alvo do projeto usa PHP 8.3. O projeto tambem depende de MySQL, Redis, Horizon e Reverb.

### Decisao

Usar Docker Compose como ambiente de referencia com MySQL 8, Redis 7, backend Laravel, Horizon, Reverb e frontend Angular.

### Consequencias

- Reduz divergencia entre maquinas locais e CI.
- Permite validar a stack completa sem instalar todos os servicos no host.
- O host ainda pode executar checks rapidos, mas Docker e CI sao a referencia para PHP 8.3.

## ADR-03 - Angular 19 standalone com Jest e Tailwind

### Contexto

O frontend precisa ser moderno, testavel e adequado para uma experiencia SaaS profissional. O scaffold padrao do Angular ainda traz Karma/Jasmine, mas o projeto busca testes rapidos e integracao simples em CI.

### Decisao

Usar Angular 19 standalone, Tailwind CSS v4, Jest com `jest-preset-angular`, ESLint Angular e aliases `@app/*`.

### Consequencias

- Reduz custo de execucao de testes no CI.
- Mantem arquitetura compativel com lazy loading, Signals/RxJS e componentes standalone.
- Exige configuracao explicita de Jest e remocao do alvo Karma.

## ADR-04 - Bibliotecas base para builder visual, realtime e icones

### Contexto

O roadmap exige um builder visual de workflows, realtime e interface polida. As bibliotecas precisam ser compativeis com Angular 19 e nao devem introduzir dependencias depreciadas.

### Decisao

Usar:

- `@foblex/flow` para o futuro canvas de workflow.
- `laravel-echo` e `pusher-js` para realtime com Reverb.
- `@lucide/angular` para icones, substituindo o pacote depreciado `lucide-angular`.

### Consequencias

- O canvas visual parte de uma biblioteca especializada, reduzindo risco de reinventar grafo/arraste/conectores.
- O realtime fica alinhado ao ecossistema Laravel/Reverb.
- A escolha de icones evita dependencia depreciada ainda na fundacao.

## ADR-05 - Separacao Definition vs Runtime com version pin

### Contexto

O FlowCore precisa permitir que administradores publiquem definicoes de workflow e que instancias ja abertas continuem presas a versao em que nasceram. Misturar dados de definicao com execucao criaria risco de alterar processos em andamento quando uma definicao fosse editada no futuro.

### Decisao

Separar o dominio em dois lados:

- Definition: `workflow_definitions`, `workflow_steps`, `step_approvers`, `workflow_transitions` e `form_fields`.
- Runtime: `workflow_instances`, `instance_steps`, `instance_step_decisions` e `workflow_actions`.

Cada `workflow_instance` guarda `workflow_definition_id` e `definition_version`.

### Consequencias

- Instancias podem ser auditadas contra a versao de definicao usada na abertura.
- A publicacao/versionamento da Fase 3B tera uma base explicita.
- Consultas de runtime ficam separadas das tabelas de configuracao do builder.

## ADR-06 - Maquinas de estado fixas para instancia e step

### Contexto

O grafo de workflow e dirigido por dados, mas o ciclo de vida de uma instancia e de um step deve ser pequeno, previsivel e testavel. Estados livres em banco aumentariam risco de transicoes impossiveis e bugs silenciosos na engine.

### Decisao

Modelar estados com enums PHP e transicoes fixas:

- Instancia: `running -> approved|rejected|cancelled|completed`.
- Step: `pending -> in_progress|skipped|escalated`; `in_progress -> approved|rejected|skipped|escalated|completed`; `escalated -> in_progress|approved|rejected|completed`.

Transicao invalida lanca `InvalidWorkflowStateTransition`.

### Consequencias

- A Fase 3C pode focar na engine `start/decide/advance`, reutilizando invariantes de estado ja testadas.
- Testes conseguem provar transicoes validas e invalidas sem depender de endpoints.
- O dominio evita aceitar status arbitrario por acidente.

## ADR-07 - Sanctum token API e formato JSON padrao

### Contexto

O frontend Angular consumira uma API REST versionada. A Fase 3A precisava entregar autenticacao real, autorizacao baseada em RBAC e respostas JSON previsiveis para erros 401, 403 e 422.

### Decisao

Usar Laravel Sanctum com tokens Bearer para `/api/v1/auth/login`, `/api/v1/auth/logout` e `/api/v1/auth/me`. Padronizar erros de API no formato:

```json
{
  "message": "Mensagem em pt-BR.",
  "code": "ERROR_CODE",
  "errors": {}
}
```

### Consequencias

- O frontend pode tratar login, sessao expirada, falta de permissao e validacao sem parsing fragil.
- Policies e middleware `permission:*` usam as permissions seedadas na Fase 2.
- A estrategia de armazenamento do token no frontend ainda sera decidida na Fase 4A.

## ADR-08 - Validacao de grafo na publicacao

### Contexto

O builder visual pode persistir drafts incompletos durante a edicao, mas uma definicao publicada precisa ser executavel pela engine futura. Publicar grafo invalido deslocaria erro estrutural para o runtime.

### Decisao

Executar `GraphValidator` em `POST /api/v1/workflows/{id}/publish`, agregando erros em 422 quando houver:

- zero ou mais de uma etapa inicial
- etapa nao alcancavel a partir do start
- ciclo no grafo
- etapa sem caminho para terminal
- `condition_expression` com sintaxe invalida no `symfony/expression-language`

As condicoes sao apenas parseadas nesta fase; avaliacao booleana fica para a engine da Fase 3C.

### Consequencias

- Drafts continuam flexiveis para o builder.
- Publicacao passa a ser o gate estrutural oficial.
- A engine futura recebe definicoes com invariantes minimas garantidas.

## ADR-09 - Versionamento imutavel por draft explicito

### Contexto

Definicoes publicadas devem ser imutaveis para nao alterar instancias futuras ou em andamento de forma silenciosa. Ao mesmo tempo, o administrador precisa evoluir um fluxo publicado.

### Decisao

Atualizacao direta de definicao publicada retorna 422. Para evoluir um fluxo, usar `POST /api/v1/workflows/{id}/draft`, que clona a definicao publicada para uma nova versao `draft` com steps, approvers, transitions e form fields.

### Consequencias

- A versao publicada permanece auditavel e intacta.
- O builder edita somente drafts.
- O contrato da API evita efeitos colaterais escondidos em uma tentativa de update.

## ADR-10 - Engine orientada por definicao publicada

### Contexto

A Fase 3C precisava executar workflows configuraveis sem hardcoded flow por tipo de solicitacao. A engine tambem precisava respeitar o versionamento imutavel definido na Fase 3B.

### Decisao

Centralizar a execucao em `WorkflowEngine`, com operacoes de dominio para `start`, `decide`, `advance`, `reassign` e `comment`. A engine inicia apenas definicoes publicadas, valida campos obrigatorios do formulario, cria instancia com `definition_version` fixado e avanca por transitions configuradas no grafo.

### Consequencias

- O runtime passa a ser dirigido pelos dados publicados no builder.
- Instancias mantem rastreabilidade da versao original da definicao.
- Regras de ciclo de vida ficam concentradas no dominio em vez de espalhadas por controllers.

## ADR-11 - Condicoes avaliadas em sandbox de dados da instancia

### Contexto

Transitions condicionais precisam avaliar expressoes de negocio como `amount > 1000`, mas permitir funcoes, objetos ou acesso externo criaria risco de injecao e comportamento nao auditavel.

### Decisao

Usar `symfony/expression-language` no `ConditionEvaluator`, expondo somente as chaves de `workflow_instances.data` como variaveis. Falhas de parse/avaliacao viram excecao de dominio da engine.

### Consequencias

- Condicoes permanecem declarativas e testaveis.
- Expressoes maliciosas sem variaveis permitidas falham fechadas.
- Funcoes customizadas de expressao ficam fora do MVP ate haver caso de uso claro.

## ADR-12 - Guard rail de profundidade na avancagem

### Contexto

Mesmo com validacao de grafo no publish, a engine nao deve depender apenas de uma garantia anterior para evitar loops ou avancos recursivos excessivos.

### Decisao

Adicionar limite defensivo de profundidade no `WorkflowEngine::advance`, falhando quando o grafo excede o limite operacional da engine.

### Consequencias

- A engine tem protecao propria contra loops e configuracoes anormais.
- Falhas ficam explicitas em vez de gerar recursao indefinida.
- O limite pode ser ajustado futuramente se workflows reais exigirem maior profundidade.

## ADR-13 - Decisoes protegidas por transacao e lock

### Contexto

Steps com `approval_mode=quorum` podem receber decisoes simultaneas. Sem lock, dois aprovadores poderiam fechar o mesmo step e duplicar contadores/auditoria.

### Decisao

Executar decisoes dentro de transacao e recarregar o `InstanceStep` com `lockForUpdate`. Depois do lock, a engine revalida status aberto, autorizacao, duplicidade e threshold antes de gravar a decisao.

### Consequencias

- Submissoes concorrentes fecham o step apenas uma vez.
- O segundo request contra step ja fechado recebe erro de dominio em vez de alterar contadores.
- A auditoria preserva uma decisao persistida para quorum 1, confirmada por smoke HTTP concorrente.

## ADR-14 - Token frontend somente em memoria

### Contexto

A Fase 4A precisava consumir a API Sanctum Bearer sem introduzir ainda uma estrategia de cookie httpOnly, BFF ou refresh token. Persistir token em `localStorage` aumentaria a janela de exposicao em caso de XSS.

### Decisao

Guardar o `access_token` apenas em memoria no `AuthService`, usando Angular Signals para estado autenticado. Refresh da pagina exige novo login nesta fase.

### Consequencias

- Reduz persistencia de credencial no browser.
- Simplifica o MVP da SPA sem inventar fluxo de refresh.
- A experiencia de sessao persistente pode ser reavaliada em hardening futuro com cookie httpOnly/BFF se o projeto evoluir para producao real.

## ADR-15 - Estado frontend com Signals, sem NgRx

### Contexto

O frontend da Fase 4A precisa de estado simples para usuario autenticado, loading e feedback. A aplicacao ainda nao tem grafo visual, runtime complexo ou cache client-side amplo que justifique store global pesada.

### Decisao

Usar Angular Signals e servicos de feature/core para estado local de autenticacao, loading e toasts. Nao adicionar NgRx ao FlowCore.

### Consequencias

- Mantem a base Angular pequena e direta.
- Evita boilerplate antes de haver necessidade real de store.
- Features futuras podem compor Signals/RxJS por dominio sem acoplar toda a SPA a um store global.

## ADR-16 - Playwright como verificador visual local

### Contexto

A Fase 4A exige smoke manual de login e shell autenticado. Sem uma ferramenta de browser exposta na sessao, a validacao visual precisava ser reproduzivel por comando.

### Decisao

Adicionar `@playwright/test` como dev dependency e usar Chromium headless para smoke local de login, dashboard e navegacao mobile.

### Consequencias

- A auditoria visual deixa de depender apenas de inspecao manual.
- A Fase 6 pode evoluir para E2E formais sem trocar ferramenta.
- A auditoria completa de dependencias dev continua separada de `npm audit --omit=dev`, pois o toolchain frontend pode carregar avisos dev-only.

## ADR-17 - Canvas Foblex com estado de dominio controlado pela aplicacao

### Contexto

A Fase 4B precisava entregar um builder visual sem transformar a biblioteca de canvas na fonte de verdade do workflow. O contrato de persistencia ja existia no backend por sub-recursos de steps, approvers, transitions e form fields.

### Decisao

Usar `@foblex/flow` para renderizar e interagir com o canvas (`f-flow`, `f-canvas`, nodes e connections), mantendo serializacao, selecao, formularios laterais e chamadas de API em servicos/componentes Angular do dominio de workflows.

### Consequencias

- O canvas fica substituivel sem alterar o contrato da API.
- O frontend nao cria um modelo paralelo de workflow incompatível com Laravel.
- A biblioteca resolve a superficie visual, enquanto regras de persistencia continuam explicitas na feature.

## ADR-18 - Erros de publish 422 como fonte de verdade visual

### Contexto

O builder precisa orientar o administrador antes da publicacao, mas duplicar toda a regra do `GraphValidator` no Angular criaria divergencia entre frontend e backend.

### Decisao

No publish, o frontend chama `POST /api/v1/workflows/{id}/publish` e usa `errors.graph` da resposta 422 para renderizar mensagens e destacar nodes/transitions por `meta.step_id` e `meta.transition_id`. Validacoes client-side ficam restritas ao formulario local.

### Consequencias

- O backend permanece a autoridade para validade do grafo.
- A UI mostra feedback contextual sem aceitar grafo que a engine recusaria.
- Novas regras de publish podem ser adicionadas no backend com baixo acoplamento no frontend, desde que preservem o shape de erro.

## ADR-19 - Runtime dirigido pelo schema publicado e visibilidade no backend

### Contexto

A experiencia runtime precisa gerar formularios a partir da definicao publicada e impedir que solicitantes consultem instancias de outros usuarios. Repetir schemas no Angular ou filtrar apenas na interface criaria divergencia e exposicao de dados.

### Decisao

Expor catalogo runtime somente com a versao publicada mais recente, validar o payload novamente na engine e aplicar `WorkflowInstance::visibleTo()` nas consultas de lista, detalhe e dashboard. Recursos runtime retornam contexto de definicao, solicitante, steps, actions e flags de acao calculadas pelas policies.

### Consequencias

- O formulario Angular segue o schema publicado sem manter uma copia paralela.
- Autorizacao e escopo permanecem no backend, independentemente da rota acessada no frontend.
- Opcoes select legadas sao normalizadas na fronteira do model/resource para preservar compatibilidade.

## ADR-20 - Filtros de solicitacoes persistidos na URL

### Contexto

Filtros de status, workflow, ownership e periodo precisam sobreviver a navegacao e permitir compartilhamento de uma visao operacional.

### Decisao

Usar query parameters como fonte de verdade dos filtros da lista de solicitacoes. O componente inicializa o formulario pela URL e atualiza a navegacao ao aplicar filtros.

### Consequencias

- Filtros ficam reproduziveis, navegaveis e testaveis.
- A lista nao depende de store global para estado efemero.
- Novos filtros devem manter compatibilidade com o contrato da API e com URLs existentes.

## ADR-21 - Realtime runtime por canais privados por usuario

### Contexto

A Fase 5 precisava atualizar inbox, detalhe e dashboard quando a engine altera uma instancia, sem polling excessivo e sem expor eventos de outros usuarios.

### Decisao

Broadcasts de runtime usam Reverb/Echo em canais privados `users.{id}.runtime`, autorizados por Sanctum em `/api/broadcasting/auth`. O backend calcula destinatarios a partir de solicitante, admins com `requests.view-all`, assignee aberto e aprovadores resolvidos. O frontend assina o canal do usuario autenticado e recarrega apenas as telas runtime afetadas.

### Consequencias

- A visibilidade continua server-side e alinhada aos contratos da Fase 4C.
- O frontend evita polling e recebe eventos somente do usuario autenticado.
- O endpoint de auth de broadcast retorna JSON com `auth` e falha fechado com 403 para canais de outros usuarios.

## ADR-22 - Escalonamento de SLA idempotente com broadcast imediato

### Contexto

Steps vencidos precisam ser escalados automaticamente sem duplicar auditoria e sem depender de refresh manual da interface operacional.

### Decisao

Adicionar `workflow:escalate-overdue` agendado a cada minuto, com `lockForUpdate`, revalidacao de status aberto e registro unico de `workflow_actions.action=escalated`. Eventos `RuntimeWorkflowUpdated` usam `ShouldBroadcastNow` para entregar refresh operacional imediatamente apos a mutacao.

### Consequencias

- O comando pode rodar repetidamente sem reescalar o mesmo step.
- Falhas de broadcast aparecem na operacao que disparou o evento em vez de ficarem silenciosas na fila.
- O payload realtime permanece pequeno e carrega apenas ids, acao e timestamp; dados completos continuam vindo das APIs runtime.

## ADR-23 - Seed demo deterministica para vitrine de portfolio

### Contexto

A Fase 6 transforma o FlowCore em uma vitrine tecnica reproduzivel. A seed anterior criava usuarios aleatorios e duplicava workflows/instancias a cada execucao, o que degradava dashboards, screenshots e avaliacao tecnica depois de resetar o ambiente.

### Decisao

Tornar `DatabaseSeeder` e `DemoWorkflowSeeder` deterministicos:

- usuarios demo sao criados/atualizados por e-mail e recebem roles via `syncRoles`;
- definicoes, steps e campos sao sincronizados por chaves estaveis;
- approvers e transitions do dataset demo sao recriados a partir da fonte declarativa da seed;
- exemplos runtime gerados pela seed recebem marcador `payload.seeded=true` em `workflow_actions`;
- apenas instancias marcadas como seedadas sao removidas/recriadas, preservando instancias manuais do avaliador.

### Consequencias

- `php artisan db:seed --force` pode ser executado repetidamente sem inflar contagens.
- O ambiente local sempre volta para um estado de demonstracao conhecido.
- Edicoes manuais feitas sobre as definicoes demo podem ser sobrescritas pela seed, o que e aceitavel para uma vitrine local e deve ser tratado por outro dataset caso o produto evolua para staging compartilhado.
