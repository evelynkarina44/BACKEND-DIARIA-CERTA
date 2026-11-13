import test from 'node:test';
import assert from 'node:assert/strict';
import { createDiaristaSchema, updateDiaristaSchema } from '../src/schemas/apiSchemas.js';
import { DiaristaSearchService } from '../src/services/diarista/DiaristaSearchService.js';
import { ListFavoritoService } from '../src/services/favorito/ListFavoritoService.js';

const input = {
  id_usuario: 1, descricao: 'Profissional organizada e experiente.', qtd_max_comodos: 8,
  endereco: { cep: '01001-000', logradouro: 'Rua de teste', numero: 1, bairro: 'Centro', cidade: 'São Paulo', estado: 'SP' },
};
test('data de nascimento é obrigatória no novo cadastro de diarista', () => {
  assert.equal(createDiaristaSchema.safeParse(input).success, false);
  assert.equal(createDiaristaSchema.parse({ ...input, data_nascimento: '1990-01-01' }).data_nascimento.toISOString(), '1990-01-01T00:00:00.000Z');
});
test('API rejeita menor de idade, futuro e datas impossíveis também no perfil de diarista', () => {
  const today = new Date();
  const minor = String(today.getFullYear() - 10) + '-01-01';
  for (const data_nascimento of [minor, '2333-12-12', '2000-02-30', '12/12/1990', '']) {
    const result = createDiaristaSchema.safeParse({ ...input, data_nascimento });
    assert.equal(result.success, false, data_nascimento);
    assert.equal(updateDiaristaSchema.safeParse({ data_nascimento }).success, false, data_nascimento);
  }
  // Cadastros antigos podem editar outros dados sem ter a nova coluna preenchida.
  assert.equal(updateDiaristaSchema.safeParse({ descricao: input.descricao }).success, true);
});
test('nascimento não é divulgado na busca pública, nos detalhes ou nos favoritos', async () => {
  const profile = { id_diarista: 1, data_nascimento: new Date('1990-01-01'), usuario: { nome: 'Profissional' }, endereco: [], diarista_servico: [], combo_base: [], avaliacao: [], avaliacao_media: null };
  const search = new DiaristaSearchService({ diarista: { findMany: async () => [profile], findUnique: async () => profile }, servico: { findMany: async () => [] } });
  assert.equal((await search.list()).data[0].data_nascimento, undefined);
  assert.equal((await search.find(1)).data_nascimento, undefined);
  const favorites = new ListFavoritoService({ findAll: async () => [{ id_favorito: 1, diarista: profile }], count: async () => 1 });
  assert.equal((await favorites.execute({}, { id_cliente: 2 })).data[0].diarista.data_nascimento, undefined);
});
