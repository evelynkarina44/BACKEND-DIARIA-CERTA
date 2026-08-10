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
