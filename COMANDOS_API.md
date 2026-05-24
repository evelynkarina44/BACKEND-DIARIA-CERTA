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
