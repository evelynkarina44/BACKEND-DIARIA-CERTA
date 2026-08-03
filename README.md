# Backend Diária Certa

API Node.js/Express com Prisma, MySQL e validação Zod.

## Requisitos

- Node.js 20 ou superior
- MySQL

## Configuração

1. Copie `.env.example` para `.env` e ajuste as variáveis.
2. Execute `npm install`.
3. Aplique migrations com `npx prisma migrate deploy`.
4. Inicie com `npm run dev` ou `npm start`.

O segredo `JWT_SECRET` deve possuir pelo menos 32 caracteres. Nunca versione o `.env`.

## Rotas disponíveis

- `GET /health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer token)
- `PATCH /api/auth/password` (Bearer token)
- `PATCH /api/usuarios/me` (Bearer token)
- `GET /api/diaristas` (busca pública paginada)
- `GET /api/diaristas/:id_diarista`
- `GET /api/servicos`

Os CRUDs legados que não possuíam autenticação/propriedade de recurso foram removidos após a análise de alcançabilidade. Os módulos restantes serão implementados com services de negócio específicos. Consulte `REVISAO_BACKEND.md`.

## Qualidade

- `npm test`: testes automatizados.
- `npm run check`: imports alcançáveis e schema Prisma.
- `npm audit`: auditoria de dependências.
