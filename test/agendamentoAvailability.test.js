import test from 'node:test';
import assert from 'node:assert/strict';
import { AgendamentoWorkflowService } from '../src/services/agendamento/AgendamentoWorkflowService.js';
import { createAgendamentoSchema } from '../src/schemas/apiSchemas.js';

function scenario() {
  const data = createAgendamentoSchema.parse({ id_diarista: 8, id_endereco: 2, data_agendamento: '2099-01-01', horario_inicio: '09:00', horario_fim: '10:00', qtd_comodos: 4, tamanho_residencia: 'media', servicos: [{ id_diarista_servico: 3 }] });
  const database = {
    diarista: { findUnique: async () => ({ id_usuario: 12, usuario: { ativo: true, bloqueado: false }, qtd_max_comodos: 6, combo_base: [] }) },
    endereco: { findUnique: async () => ({ id_cliente: 2 }) },
    diarista_servico: { findMany: async () => [{ id_diarista_servico: 3, id_diarista: 8, id_servico: 4, ativo: true, preco: 100 }] },
    disponibilidade_diarista: { findMany: async () => [{ horario_inicio: data.horario_inicio, horario_fim: data.horario_fim }] },
    agendamento: { findMany: async () => [] },
  };
  return { data, database, auth: { id_usuario: 1, id_cliente: 2 } };
}

test('estimativa rejeita horário ocupado, serviço desativado e intervalo adulterado', async () => {
  const { data, database, auth } = scenario();
  const service = new AgendamentoWorkflowService(database);
  assert.equal((await service.estimate(data, auth)).valor_estimado, 100);
  database.agendamento.findMany = async () => [{ id_agendamento: 5, horario_inicio: data.horario_inicio, horario_fim: data.horario_fim }];
  await assert.rejects(() => service.estimate(data, auth), /agendamento aceito/);
  database.agendamento.findMany = async () => [];
  await assert.rejects(() => service.estimate({ ...data, horario_fim: new Date('1970-01-01T11:00:00Z') }, auth), /intervalo/);
  database.diarista_servico.findMany = async () => [{ id_diarista: 8, ativo: false }];
  await assert.rejects(() => service.estimate(data, auth), /serviços/);
});

test('estimativa rejeita conta bloqueada e datas impossíveis', async () => {
  const { data, database, auth } = scenario();
  database.diarista.findUnique = async () => ({ usuario: { ativo: true, bloqueado: true } });
  await assert.rejects(() => new AgendamentoWorkflowService(database).estimate(data, auth), /contratação/);
  assert.equal(createAgendamentoSchema.safeParse({ ...data, data_agendamento: '2027-02-30' }).success, false);
});

test('estimativa e criação não bloqueiam cômodos acima dos limites da diarista ou do combo', async () => {
  const { data, database, auth } = scenario();
  const combo = { id_combo_base: 9, valor_base: 80, qtd_comodos_casa: 1, atende_casa_media: true, atende_casa_pequena: false, atende_casa_grande: false, combo_servico: [{ id_servico: 4 }] };
  database.diarista.findUnique = async () => ({ id_usuario: 12, usuario: { ativo: true, bloqueado: false }, qtd_max_comodos: 1, combo_base: [combo] });
  let stored;
  database.agendamento.create = async ({ data: input }) => {
    stored = input;
    return { ...input, id_agendamento: 1, status: 'Pendente', agendamento_servico: [] };
  };
  const service = new AgendamentoWorkflowService(database);
  for (const [payload, expectedPrice] of [[data, 100], [{ ...data, id_combo_base: 9 }, 80]]) {
    assert.equal((await service.estimate(payload, auth)).valor_estimado, expectedPrice);
    const created = await service.create(payload, auth, true);
    assert.equal(created.valor_estimado, expectedPrice);
    assert.equal(stored.qtd_comodos, 4);
  }
  await assert.rejects(() => service.estimate({ ...data, id_combo_base: 9, tamanho_residencia: 'grande' }, auth), /tamanho da residência/);
  await assert.rejects(() => service.estimate(data, { ...auth, id_usuario: 12 }), /próprio perfil/);
});
