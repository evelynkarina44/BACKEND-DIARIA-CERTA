# Comandos da API

Base URL:

```text
http://localhost:3000
```

## Usuario

### Criar usuario

#### curl

```bash
curl -X POST "http://localhost:3000/api/usuario" ^
  -H "Content-Type: application/json" ^
  -d "{\"dados\":{\"nome\":\"Maria Silva\",\"email\":\"maria.silva@email.com\",\"senha\":\"123456\",\"telefone\":\"11999999999\",\"foto_perfil\":\"https://exemplo.com/foto.jpg\"}}"
```

#### Postman

- Method: `POST`
- URL: `http://localhost:3000/api/usuario`
- Headers: `Content-Type: application/json`
- Body > raw > JSON:

```json
{
  "dados": {
    "nome": "Maria Silva",
    "email": "maria.silva@email.com",
    "senha": "123456",
    "telefone": "11999999999",
    "foto_perfil": "https://exemplo.com/foto.jpg"
  }
}
```

### Buscar todos os usuarios

#### curl

```bash
curl -X GET "http://localhost:3000/api/usuario"
```

#### Postman

- Method: `GET`
- URL: `http://localhost:3000/api/usuario`
- Sem body

### Buscar usuario por id

#### curl

```bash
curl -X GET "http://localhost:3000/api/usuario/1"
```

#### Postman

- Method: `GET`
- URL: `http://localhost:3000/api/usuario/1`
- Sem body

## Cliente

### Criar cliente

#### curl

```bash
curl -X POST "http://localhost:3000/api/cliente" ^
  -H "Content-Type: application/json" ^
  -d "{\"dados\":{\"id_usuario\":1,\"data_nascimento\":\"1995-08-20\",\"qtd_comodos\":3,\"tamanho_casa\":\"pequena\"}}"
```

#### Postman

- Method: `POST`
- URL: `http://localhost:3000/api/cliente`
- Headers: `Content-Type: application/json`
- Body > raw > JSON:

```json
{
  "dados": {
    "id_usuario": 1,
    "data_nascimento": "1995-08-20T00:00:00.000Z",
    "qtd_comodos": 3,
    "tamanho_casa": "pequena"
  }
}
```

### Buscar todos os clientes

#### curl

```bash
curl -X GET "http://localhost:3000/api/cliente"
```

#### Postman

- Method: `GET`
- URL: `http://localhost:3000/api/cliente`
- Sem body

### Buscar cliente por id

#### curl

```bash
curl -X GET "http://localhost:3000/api/cliente/1"
```

#### Postman

- Method: `GET`
- URL: `http://localhost:3000/api/cliente/1`
- Sem body

## Diarista

### Criar diarista

#### curl

```bash
curl -X POST "http://localhost:3000/api/diarista" ^
  -H "Content-Type: application/json" ^
  -d "{\"dados\":{\"id_usuario\":2,\"descricao\":\"Profissional com experiencia em limpeza residencial.\",\"frequencia_resposta\":\"rapida\",\"qtd_max_comodos\":5,\"avaliacao_media\":4.8}}"
```

#### Postman

- Method: `POST`
- URL: `http://localhost:3000/api/diarista`
- Headers: `Content-Type: application/json`
- Body > raw > JSON:

```json
{
  "dados": {
    "id_usuario": 2,
    "descricao": "Profissional com experiencia em limpeza residencial.",
    "frequencia_resposta": "rapida",
    "qtd_max_comodos": 5,
    "avaliacao_media": 4.8
  }
}
```

### Buscar todas as diaristas

#### curl

```bash
curl -X GET "http://localhost:3000/api/diarista"
```

#### Postman

- Method: `GET`
- URL: `http://localhost:3000/api/diarista`
- Sem body

### Buscar diarista por id

#### curl

```bash
curl -X GET "http://localhost:3000/api/diarista/1"
```

#### Postman

- Method: `GET`
- URL: `http://localhost:3000/api/diarista/1`
- Sem body

## Combo Base

### Criar combo base

#### curl

```bash
curl -X POST "http://localhost:3000/api/combo_base" ^
  -H "Content-Type: application/json" ^
  -d "{\"dados\":{\"id_diarista\":1,\"nome_combo\":\"Combo Casa Pequena\",\"valor_base\":120.50,\"descricao\":\"Limpeza completa para casas pequenas\",\"qtd_comodos_casa\":3,\"atende_casa_pequena\":true,\"atende_casa_media\":false,\"atende_casa_grande\":false}}"
```

#### Postman

- Method: `POST`
- URL: `http://localhost:3000/api/combo_base`
- Headers: `Content-Type: application/json`
- Body > raw > JSON:

```json
{
  "dados": {
    "id_diarista": 1,
    "nome_combo": "Combo Casa Pequena",
    "valor_base": 120.5,
    "descricao": "Limpeza completa para casas pequenas",
    "qtd_comodos_casa": 3,
    "atende_casa_pequena": true,
    "atende_casa_media": false,
    "atende_casa_grande": false
  }
}
```

### Buscar todos os combos base

#### curl

```bash
curl -X GET "http://localhost:3000/api/combo_base"
```

#### Postman

- Method: `GET`
- URL: `http://localhost:3000/api/combo_base`
- Sem body

### Buscar combo base por id

#### curl

```bash
curl -X GET "http://localhost:3000/api/combo_base/1"
```

#### Postman

- Method: `GET`
- URL: `http://localhost:3000/api/combo_base/1`
- Sem body

### Atualizar combo base

#### curl

```bash
curl -X PUT "http://localhost:3000/api/combo_base/1" ^
  -H "Content-Type: application/json" ^
  -d "{\"dados\":{\"nome_combo\":\"Combo Casa Media\",\"valor_base\":150.00,\"descricao\":\"Atualizado\",\"qtd_comodos_casa\":4,\"atende_casa_pequena\":true,\"atende_casa_media\":true,\"atende_casa_grande\":false}}"
```

#### Postman

- Method: `PUT`
- URL: `http://localhost:3000/api/combo_base/1`
- Headers: `Content-Type: application/json`
- Body > raw > JSON:

```json
{
  "dados": {
    "nome_combo": "Combo Casa Media",
    "valor_base": 150.0,
    "descricao": "Atualizado",
    "qtd_comodos_casa": 4,
    "atende_casa_pequena": true,
    "atende_casa_media": true,
    "atende_casa_grande": false
  }
}
```

### Deletar combo base

#### curl

```bash
curl -X DELETE "http://localhost:3000/api/combo_base/1"
```

#### Postman

- Method: `DELETE`
- URL: `http://localhost:3000/api/combo_base/1`
- Sem body
