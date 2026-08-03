# Revisão completa do backend — Diária Certa

Revisão baseada nos documentos `diariacerta.docx` e `diaria certa .docx`, no código encontrado e na inspeção somente estrutural do MySQL (sem leitura de dados pessoais).

## Estado encontrado

O repositório contém apenas backend e usa Express, Prisma e Zod. Havia models para usuário, cliente, diarista, endereço, serviço, serviços da diarista, combo, agendamento, itens, check-in/check-out, avaliação, favorito, denúncia, ocorrência e disponibilidade.

Apesar da quantidade de arquivos, o servidor não iniciava: o pacote declarava CommonJS e o código usava ESM; imports de Express, rotas, controllers e services estavam incorretos. Os services apenas repassavam dados ao Prisma e quase todas as rotas estavam sem validação. Não existia autenticação, autorização ou middleware global de erros.

O banco já existia, mas não era gerenciado pelo Prisma Migrate. Na inspeção inicial, apenas `usuario.email` tinha constraint única além das chaves primárias. As senhas existentes estavam em texto puro.

## Correções aplicadas

### CRÍTICO

- Padronização em ESM, separação real entre `app.js` e `server.js` e imports alcançáveis verificados.
- Middleware global de erro com envelope `{ error: { code, message } }`, sem stack trace na resposta.
- Cadastro/login, JWT HS256 com expiração e segredo externo, revalidação do estado do usuário a cada requisição privada.
- Hash de senha com `scrypt`, salt aleatório e comparação constante. Todas as senhas existentes foram migradas sem exibição e sem troca do valor conhecido pelo usuário.
- Queries de usuário usam `select` explícito e nunca retornam senha, CPF ou flag de bloqueio.
- CRUD administrativo de usuários foi removido da superfície HTTP; o usuário só edita o próprio perfil e troca senha confirmando a senha atual.

### ALTO

- Middleware Zod genérico valida `body`, `params` e `query`, substituindo entradas pelos dados validados e rejeitando propriedades desconhecidas nos contratos ativos.
- Cadastro de CLIENTE e DIARISTA usa contratos distintos e cria usuário/perfil de forma atômica via nested write do Prisma.
- Busca pública de diaristas implementada com paginação, ordenação e filtros por nome, cidade, bairro, avaliação, preço e serviço. A resposta não expõe e-mail, telefone nem endereço.
- Perfis cliente/diarista agora são 1:1 com usuário no banco.
- Constraints únicas adicionadas a favorito, serviço da diarista, item de combo, item de agendamento, check-in por agendamento e avaliação cliente/agendamento.
- Status de agendamento expandido para representar solicitação, check-in, execução e conclusão.
- Agendamento ganhou expiração, resposta, horário, dados da residência, snapshot de endereço e composição monetária básica. Itens preservam nome, descrição e preço contratado.
- Check-in/check-out pode começar sem horários artificiais; timestamps são opcionais até cada evento ocorrer.
- Endereço aceita um proprietário cliente ou diarista e ganhou identificação, ativo e coordenadas opcionais. A regra XOR ainda deve ser aplicada no service antes da publicação da rota.
- Baseline e migration incremental criados e aplicados; o schema local está sincronizado.

### MÉDIO/BAIXO

- `.env.example`, README, health check, limite de JSON e remoção do header `X-Powered-By`.
- Dependências restauradas e vulnerabilidades transitivas de DoS corrigidas; auditoria ficou com zero vulnerabilidades.
- Testes para senha, JWT, health, validação, autenticação obrigatória e erro 404.
- Remoção de 241 arquivos de scaffolding mortos, duplicados ou inexecutáveis após confirmar que não eram alcançados por `app.js`.

## Funcionalidades encontradas

| Domínio | Antes | Depois da revisão |
| --- | --- | --- |
| Usuário | CRUD inseguro e inexecutável | Cadastro/login, sessão, alteração própria e troca de senha |
| Cliente/diarista | Models e CRUD sem regra | Cadastro de perfil atômico; perfil público seguro de diarista |
| Busca | Não existia de fato | Busca paginada e filtrada de diaristas |
| Serviços/combo | Models e CRUD genérico | Catálogo público e modelagem/constraints; gestão privada pendente |
| Agendamento | CRUD genérico | Schema preparado para snapshots/ciclo; fluxo transacional pendente |
| Agenda | Registro de data/hora inicial | Model ainda insuficiente para recorrência/exceções |
| Favoritos | CRUD duplicável | Unicidade garantida no banco; API por proprietário pendente |
| Check-in/out | CRUD arbitrário | Model corrigido; ações específicas pendentes |
| Avaliação | Apenas cliente→diarista | Duplicidade parcial bloqueada; avaliação bidirecional exige remodelagem |
| Pagamento/notificação | Ausentes | Mantidos como funcionalidades futuras |

## Pendências por prioridade

### ALTO

1. Implementar `createAppointment`, `accept`, `reject`, `cancel`, `request/confirm check-in` e `request/confirm check-out` como ações específicas. Cada ação deve validar participante, estado e prazo; aceitação precisa de transação e proteção contra concorrência.
2. Implementar gestão de serviços, combo, disponibilidade, endereços e favoritos usando sempre o usuário autenticado; nunca aceitar `id_cliente`/`id_diarista` como prova de propriedade.
3. Separar disponibilidade recorrente, exceção e bloqueio. O model atual ainda não representa corretamente expediente semanal, folga e sobreposição por duração.
4. Remodelar avaliação para `avaliador_usuario` e `avaliado_usuario`, com unicidade `agendamento + avaliador`, privacidade e somente após conclusão.
5. Criar snapshot completo do endereço e dos itens no service de criação do agendamento. As colunas já existem, mas nenhuma rota insegura foi publicada para preenchê-las incorretamente.

### MÉDIO

1. Criar testes de integração em banco isolado e testes de concorrência para aceitação, favorito e avaliação.
2. Calcular `avaliacao_media` e `frequencia_resposta` a partir do histórico ou documentar estratégia de atualização; hoje são campos armazenados sem sincronização.
3. Adicionar constraints `CHECK` via SQL para nota, preços, quantidade de cômodos, latitude/longitude e exatamente um proprietário do endereço (avaliar compatibilidade da versão do MySQL).
4. Definir se CPF será obrigatório. Foi adicionado como único e opcional para preservar os usuários existentes.
5. Definir política de desativação/exclusão; FKs `NoAction` evitam perda acidental, mas exigem soft delete consistente.

### FUNCIONALIDADE FUTURA / DECISÃO PENDENTE

- Política de cancelamento, multa, duração padrão e intervalo entre serviços.
- Provedor de pagamento, webhook idempotente, reembolso e repasse. Não armazenar cartão.
- Geolocalização/distância e política de exposição de região.
- Jobs para expirar solicitações em 48 horas e notificações. Mesmo com job, services devem rejeitar ação após `expira_em`.
- Moderação de avaliações/denúncias e perfil administrativo.

## Riscos e compatibilidade

- A segurança exigiu remover os CRUDs arbitrários legados. Eles não eram alcançáveis e o servidor não funcionava no estado inicial, mas clientes que tenham implementado os caminhos antigos precisarão migrar para as novas rotas.
- Usuários existentes receberam `tipo=CLIENTE` por default. Antes de uso real, confirmar e corrigir o tipo dos usuários que sejam diaristas.
- A migration adiciona constraints. As tabelas relacionadas estavam sem duplicidades na aplicação; futuras importações precisam respeitá-las.
- O enum de agendamento mudou para um ciclo maior. Código consumidor deve usar os valores expostos pelo Prisma (`PENDENTE`, `ACEITA`, etc.).

## Sequência recomendada

1. Confirmar decisões pendentes de agendamento/cancelamento/duração.
2. Implementar services de propriedade para endereço, serviços, combo e disponibilidade.
3. Implementar solicitação/estimativa/snapshot e ações de status com transações.
4. Implementar check-in/out e só então integrar pagamento.
5. Remodelar avaliações bidirecionais.
6. Adicionar worker de expiração/notificações e ampliar testes de integração/concorrência.
