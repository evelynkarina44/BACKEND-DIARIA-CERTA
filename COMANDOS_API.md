# Comandos da API

Base URL: `http://localhost:3000`

Os exemplos abaixo usam `curl` com sintaxe compatível com PowerShell. Respostas de sucesso usam `data`; erros usam `error.code` e `error.message`.

## Saúde

```powershell
curl.exe http://localhost:3000/health
```

## Cadastro de cliente

```powershell
curl.exe -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{"tipo":"CLIENTE","nome":"Maria Silva","email":"maria@example.com","senha":"senha-segura-123","telefone":"11999999999","data_nascimento":"1995-08-20","qtd_comodos":3,"tamanho_casa":"media"}'
```

## Cadastro de diarista

```powershell
curl.exe -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{"tipo":"DIARISTA","nome":"Ana Souza","email":"ana@example.com","senha":"senha-segura-123","telefone":"11988888888","descricao":"Profissional de limpeza residencial com experiência.","qtd_max_comodos":6}'
```

## Login

```powershell
curl.exe -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"maria@example.com","senha":"senha-segura-123"}'
```

Copie o valor retornado em `data.token` para os comandos privados.

```powershell
$token = "TOKEN_RETORNADO_NO_LOGIN"
```

## Perfil autenticado

```powershell
curl.exe http://localhost:3000/api/auth/me -H "Authorization: Bearer $token"
```

## Atualizar o próprio usuário

```powershell
curl.exe -X PATCH http://localhost:3000/api/usuarios/me `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{"nome":"Maria da Silva","telefone":"11977777777"}'
```

## Trocar senha

```powershell
curl.exe -X PATCH http://localhost:3000/api/auth/password `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{"senha_atual":"senha-segura-123","nova_senha":"outra-senha-segura-456"}'
```

## Buscar diaristas

```powershell
curl.exe "http://localhost:3000/api/diaristas?page=1&limit=10&cidade=Sao%20Paulo&avaliacao_minima=4&ordenar_por=avaliacao&ordem=desc"
```

Filtros aceitos: `nome`, `cidade`, `bairro`, `avaliacao_minima`, `preco_minimo`, `preco_maximo`, `servico_id`, `page`, `limit`, `ordenar_por` e `ordem`.

## Consultar uma diarista

```powershell
curl.exe http://localhost:3000/api/diaristas/1
```

## Catálogo de serviços

```powershell
curl.exe http://localhost:3000/api/servicos
```

Os CRUDs genéricos antigos não são publicados porque aceitavam IDs de proprietário enviados pelo cliente, não tinham autenticação e permitiam alterações arbitrárias. A sequência segura para os módulos restantes está em `REVISAO_BACKEND.md`.
