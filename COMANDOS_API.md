# API Diária Certa

Base local: `http://localhost:3000`

## Swagger / OpenAPI

Com a API em execução, acesse:

- Swagger UI: `http://localhost:3000/api-docs`
- Contrato OpenAPI 3.0.3 em JSON: `http://localhost:3000/api-docs.json`

Use o botão **Authorize** do Swagger UI com o token obtido no login. A interface
separa as operações por domínio e indica quais rotas exigem autenticação.

## Preparação

```powershell
npm install
npm run prisma:generate
```

O schema foi evoluído e a migration está em
`prisma/migrations/20260809000000_backend_evolution/migration.sql`.
Antes de aplicá-la, elimine eventuais duplicidades nos perfis, favoritos e tabelas
de associação que passarão a ter chaves únicas. A migration não é executada ao
iniciar a API.

Variáveis necessárias:

```dotenv
DATABASE_URL="mysql://usuario:senha@localhost:3306/diaria_certa"
JWT_SECRET="troque-por-um-segredo-longo-e-aleatorio"
JWT_EXPIRES_IN="8h"
PORT=3000
CORS_ORIGIN="http://localhost:5173"
APP_TIMEZONE_OFFSET_MINUTES=180
```

## Autenticação

Criar usuário:

```http
POST /api/usuario
Content-Type: application/json

{
  "nome": "Maria Silva",
  "email": "maria@example.com",
  "senha": "senha-segura",
  "telefone": "11999999999",
  "foto_perfil": ""
}
```

Login:

```http
POST /api/auth/login
Content-Type: application/json

{ "email": "maria@example.com", "senha": "senha-segura" }
```

Envie o token nas rotas privadas:

```http
Authorization: Bearer <token>
```

`GET /api/auth/me` retorna o usuário e os perfis disponíveis. Um mesmo usuário
pode possuir um perfil em `/api/cliente` e outro em `/api/diarista`.

## Recursos e CRUDs existentes

Os CRUDs usam JSON direto, sem o envelope antigo `{"dados": ...}`.

| Recurso | Base | Acesso de leitura | Escrita |
|---|---|---|---|
| Usuário | `/api/usuario` | próprio usuário | próprio usuário |
| Cliente | `/api/cliente` | próprio perfil | próprio perfil |
| Diarista | `/api/diarista` | público | própria diarista |
| Endereço | `/api/endereco` | proprietário | proprietário |
| Serviço | `/api/servico` | público | autenticado |
| Serviço da diarista | `/api/diarista-servico` | público | própria diarista |
| Combo base | `/api/combo-base` | público | própria diarista |
| Serviço do combo | `/api/combo-servico` | público | dona do combo |
| Disponibilidade | `/api/disponibilidade` | público | própria diarista |
| Agendamento | `/api/agendamento` | participantes | conforme transição |
| Serviços agendados | `/api/agendamento-servico` | participantes | criados pelo agendamento |
| Avaliação | `/api/avaliacao` | pública ou participante | autor |
| Favorito | `/api/favorito` | próprio cliente | próprio cliente |
| Denúncia | `/api/denuncia` | denunciante | denunciante |
| Ocorrência | `/api/ocorrencia` | participantes | participantes |

Listagens aceitam `page` e `limit` quando aplicável. IDs usam `/:id`.

## Busca de diaristas

```http
GET /api/diarista?nome=ana&cidade=Campinas&avaliacao_min=4&preco_max=200&id_servico=1&ordenar=avaliacao&page=1&limit=20
```

Filtros: `nome`, `bairro`, `cidade`, `estado`, `avaliacao_min`, `preco_min`,
`preco_max`, `id_servico` e `ordenar` (`avaliacao`, `preco_asc`, `preco_desc`,
`nome`). O perfil detalhado é `GET /api/diarista/:id`.

Estatísticas privadas: `GET /api/diarista/:id/estatisticas`.

## Agendamento

Primeiro solicite uma estimativa:

```http
POST /api/agendamento/estimativa
Authorization: Bearer <token-cliente>
Content-Type: application/json

{
  "id_diarista": 1,
  "id_endereco": 1,
  "data_agendamento": "2030-01-20",
  "horario_inicio": "08:00",
  "horario_fim": "12:00",
  "qtd_comodos": 4,
  "tamanho_residencia": "media",
  "observacoes": "Há animais no local",
  "servicos": [
    { "id_diarista_servico": 1 },
    { "id_diarista_servico": 2 }
  ]
}
```

Para confirmar, envie o mesmo payload a `POST /api/agendamento`. O preço dos
serviços é copiado para o agendamento e não muda se a diarista alterar o catálogo.
A solicitação expira 48 horas após a criação.

Transições:

- `POST /api/agendamento/:id/aceitar` — diarista;
- `POST /api/agendamento/:id/recusar` — diarista;
- `POST /api/agendamento/:id/cancelar` — participante, body opcional `descricao`;
- `GET /api/agendamento?visao=solicitacoes|futuros|historico|todos`;
- `GET /api/agendamento?status=Pendente`.

Ao aceitar, o Service verifica conflito com horários já aceitos ou em andamento.

## Check-in, pagamento e check-out

- `POST /api/checkin-checkout/agendamento/:id/solicitar` — diarista;
- `POST /api/checkin-checkout/agendamento/:id/confirmar-pagamento` — cliente;
- `POST /api/checkin-checkout/agendamento/:id/checkout` — diarista;
- `GET /api/checkin-checkout/agendamento/:id` — participantes.

O endpoint de confirmação registra o pagamento e inicia o serviço. Em produção,
ele deve ser chamado somente após confirmação do gateway/webhook escolhido; a
integração com um provedor financeiro específico não faz parte deste repositório.

## Avaliações

```http
POST /api/avaliacao
Authorization: Bearer <token>
Content-Type: application/json

{
  "id_agendamento": 1,
  "nota": 4.8,
  "comentario": "Ótimo serviço",
  "publica": true,
  "anonima": false
}
```

Somente agendamentos concluídos aceitam avaliação. Cliente e diarista podem
avaliar uma vez cada; a média profissional é recalculada automaticamente.

## Execução e verificação

```powershell
npm run dev
npm test
npm run prisma:validate
```

Health check: `GET /health`.

## Assistente com Gemini e RAG

No aplicativo, entre com perfil ativo de cliente e abra **Menu → Assistente**.
O histórico fica no MySQL e é retomado ao abrir a tela. O botão `+` inicia outra
conversa. Mensagens não enviam solicitações automaticamente: o cliente deve
revisar o card e pressionar **Confirmar solicitação**. O agendamento fica
`Pendente`, aguardando aceite da diarista.

Configure somente no `.env` do backend, sem colocar a chave no frontend:

```dotenv
GEMINI_API_KEY=sua-chave
GEMINI_MODEL=gemini-3.5-flash-lite
CHATBOT_MODEL_CACHE_DIR=.cache/chatbot-models
CHATBOT_RAG_MIN_SCORE=0.35
```

```powershell
npm install
npm run prisma:generate
npm run chatbot:prepare
npm run chatbot:check
npm run dev
```

`chatbot:prepare` baixa e armazena localmente os pesos ONNX do modelo
`Xenova/paraphrase-multilingual-MiniLM-L12-v2`, testa os embeddings normalizados
de 384 dimensões e mostra exemplos de recuperação. O primeiro download exige
internet. O cache fica fora do Git. O índice documental é mantido em memória
e reconstruído ao reiniciar; o modelo baixado é reutilizado.

`chatbot:check` verifica as três tabelas e informa se a chave está configurada,
sem revelar seu valor. Reinicie o servidor depois de configurar a chave.
Sem a chave, o chatbot retorna 503 ao interpretar mensagens; a tela mantém acesso
à busca manual. Não há respostas simulando uma chamada real ao Gemini.

### Endpoints efetivamente implementados

Todos exigem Bearer JWT e perfil ativo de cliente. IDs são UUIDs.

| Método e caminho | Finalidade |
|---|---|
| `GET /api/chatbot/conversas?page=1&limit=20` | Lista paginada dos chats do cliente autenticado, com título, datas e quantidade de mensagens |
| `POST /api/chatbot/conversas` | `{ "nova": false }` retoma; `true` inicia outra conversa |
| `GET /api/chatbot/conversas/:id` | Histórico recente, opções e proposta atual do próprio cliente |
| `POST /api/chatbot/conversas/:id/mensagens` | `{ "id_requisicao": "UUID", "mensagem": "amanhã às 9h, para limpar janelas" }` |
| `POST /api/chatbot/propostas/:id/confirmar` | Revalida os dados e cria uma solicitação pendente, de forma idempotente |
| `POST /api/chatbot/propostas/:id/cancelar` | Encerra somente uma proposta ainda não enviada |

Cada mensagem usa um UUID de requisição. Em tentativas de reenvio, mantenha o
mesmo UUID. A API preserva a ordem por versão, rejeitando edições simultâneas
desatualizadas. Confirmações repetidas retornam o mesmo agendamento. As propostas
valem dez minutos; mudanças no cadastro ou preço invalidam a proposta e exigem
uma nova busca e confirmação. A conversa suporta até 200 alterações; nesse
caso, inicie outra. O limite é de 20 requisições por minuto por usuário.

Na tela do assistente, o botão **Conversas** abre os chats anteriores, ordenados
pela última atualização. Selecione um para consultar o histórico e continuar de
onde parou; o botão `+` inicia outro chat sem apagar os anteriores. A listagem usa
20 itens por página (máximo 50 pela API), com a opção de carregar mais. Retomar
uma conversa recupera suas mensagens e a proposta atual com o status existente;
isso não renova propostas expiradas nem envia novamente solicitações confirmadas.
O histórico é restrito ao cliente autenticado. A consulta recupera até 401 mensagens,
cobrindo o limite de 200 alterações da conversa, sem truncar em 60 mensagens.

O campo opcional `selecao` permite escolher somente uma opção previamente
oferecida na conversa: `id_servico`, `id_endereco` ou `id_combo_base` (`null`
remove o combo). Identidade, preços e payloads de agendamento nunca são aceitos
do modelo ou do frontend. Endereços e valores exibidos no card vêm do backend.

### Análise e adaptação do Chatbot NYLEVE para o DIÁRIA CERTA

Referência: notebook `P3_Chatbot_Nyleve.ipynb`, 25 células. O código reaproveita
seu pipeline de documentos → chunks → embeddings locais → similaridade →
contexto → Gemini, com até seis mensagens recentes para contextualização.

| NYLEVE | DIÁRIA CERTA |
|---|---|
| Produtos e políticas da loja | Regras verificadas em `src/knowledge/platformKnowledge.js` |
| Chunks de 450 caracteres e sobreposição de 60 | Mesmos limites iniciais, reduzidos quando necessário para respeitar os 128 tokens do modelo |
| Sentence Transformers em Python | Mesmo modelo multilíngue em ONNX pelo Transformers.js no Node.js |
| Produto escalar de vetores normalizados | Mesma comparação, com limiar configurável e perguntas editoriais associadas aos documentos |
| Três trechos sempre retornados | Até três trechos relevantes; pode não haver contexto suficiente |
| Prompt do Gemini e histórico Gradio | Extração estruturada validada por Zod; histórico e estado no servidor |
| Gradio | Tela React Native/Expo integrada ao aplicativo |
| Respostas textuais | Explicações fundamentadas e card com dados reais dos Services |

As perguntas editoriais reforçam a recuperação dos documentos associados sem
criar novas regras. As fontes usadas são retornadas junto às respostas.
Dados de profissionais, valores e disponibilidade não são armazenados no RAG:
essas informações são consultadas no MySQL e revalidadas antes do envio.

Perguntas como “Rafael Sá tem combos?” consultam o catálogo público atual no banco,
não o RAG editorial. A resposta lista combos ativos, preços e serviços incluídos.
“Quais serviços ela oferece?” reutiliza a diarista consultada ou a profissional
da proposta em contexto, relendo os dados a cada pergunta. Um nome explícito
substitui essa referência; nomes inexistentes ou ambíguos geram esclarecimento.
Sem identificação, o assistente pede o nome. A consulta não expõe dados privados,
não cria agendamentos, não troca o combo da proposta e não garante disponibilidade.
Dúvidas gerais sobre as regras da plataforma continuam usando o RAG.

A busca exige todos os serviços ativos, conta ativa e intervalo disponível.
A quantidade de cômodos permanece informativa: não bloqueia a busca, a estimativa,
a solicitação de agendamento nem a escolha de combos. A compatibilidade do combo
com o tamanho da residência (pequena, média ou grande) continua sendo verificada.
A distância é geográfica aproximada por CEP;
profissionais sem coordenadas conhecidas não são rotuladas como mais próximas.
O horário de início não é uma estimativa da duração real da faxina. São usados
os intervalos cadastrados na agenda existente.

### Migration e testes

A migration `20261020000000_chatbot` adiciona somente `chatbot_conversa`,
`chatbot_mensagem` e `chatbot_proposta`, sem renomear tabelas existentes.
Na instalação local de desenvolvimento foi encontrada divergência no histórico
das migrations antigas. Por isso, aplicou-se apenas o SQL da migration nova e
registrou-se essa migration com `prisma migrate resolve --applied`.
O histórico antigo permanece pendente de reconciliação: não execute reset nem
reaplique migrations antigas sobre dados existentes para tentar corrigi-lo.
Em ambientes com histórico consistente, utilize o fluxo normal de deploy das
migrations. Faça backup e confira a situação do ambiente antes de migrar.

```powershell
npm test
npm run prisma:validate
# Integração com MySQL: cria fixtures apenas dentro de transação e reverte tudo.
$env:RUN_CHATBOT_DATABASE_TESTS = '1'
node --test test/chatbotDatabase.test.js
```

Os testes cobrem datas relativas no fuso de São Paulo, catálogo real, propriedade
da conversa, preço alterado, expiração, cancelamento, idempotência e conflito de
horário no fluxo compartilhado. Testes da lógica não consomem a API do Gemini.
Para validar a IA ao vivo, configure a chave e teste a conversa no aplicativo;
esse teste utiliza a cota da conta Google configurada.

Na auditoria desta implementação, as correções compatíveis foram aplicadas.
Persistem avisos altos em dependências transitivas do Prisma e do nodemon.
As soluções automáticas propostas exigem mudança de versão principal ou downgrade;
essas mudanças não foram aplicadas junto ao chatbot e precisam de revisão própria.
