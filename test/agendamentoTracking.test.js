import test from 'node:test';
import assert from 'node:assert/strict';
import { AgendamentoTrackingService } from '../src/services/agendamento/AgendamentoTrackingService.js';

function fixture() {
  const row = {
    id_agendamento: 44, status: 'Concluido', data_agendamento: new Date('2026-11-01T00:00:00Z'),
    horario_inicio: new Date('1970-01-01T22:30:00Z'), expira_em: null, valor_estimado: 70,
    cliente: { usuario: { nome: 'Cliente de teste', foto_perfil: null } },
    diarista: { usuario: { nome: 'Profissional de teste', foto_perfil: null } },
    endereco: { logradouro: 'Rua de teste', numero: '1', bairro: 'Centro', cidade: 'Teste', estado: 'SP' },
    agendamento_servico: [{ diarista_servico: { servico: { nome_servico: 'Limpeza' } } }],
    pagamento_parcela: ['Entrada', 'Saldo'].map(fase => ({ fase, status: 'Pago', valor_centavos: 3500, transacoes: [], checkout_url: 'NAO_EXIBIR', id_preferencia: 'NAO_EXIBIR' })),
    checkin_checkout: [{ horario_checkin: new Date(), horario_checkout: new Date(), status_checkin: 'Finalizado' }],
    avaliacao: [],
  };
  const calls = [];
  const database = { agendamento: {
    findMany: async args => { calls.push(args); return [row]; },
    count: async args => { calls.push(args); return 1; },
  }, $transaction: () => assert.fail('Acompanhamento não pode gravar dados') };
  return { row, calls, service: new AgendamentoTrackingService(database, () => new Date('2026-11-02T12:00:00Z')) };
}

test('acompanhamento exige perfil ativo e restringe consulta ao participante desse perfil', async () => {
  const f = fixture();
  for (const auth of [null, {}, { id_cliente: 2 }, { activeProfile: 'CLIENTE', id_diarista: 3 }]) {
    await assert.rejects(() => f.service.list({}, auth), /Selecione um perfil/);
  }
  const both = { activeProfile: 'CLIENTE', id_cliente: 2, id_diarista: 3 };
  await f.service.list({}, both);
  assert.equal(f.calls[0].where.id_cliente, 2);
  assert.equal(f.calls[0].where.id_diarista, undefined);
  assert.deepEqual(f.calls[0].where, f.calls[1].where);
  await f.service.list({}, { ...both, activeProfile: 'DIARISTA' });
  assert.equal(f.calls[2].where.id_diarista, 3);
  assert.equal(f.calls[2].where.id_cliente, undefined);
});

test('acompanhamento é paginado e retorna nome do outro participante sem dados internos do provedor', async () => {
  const f = fixture();
  const response = await f.service.list({ page: 2, limit: 10 }, { activeProfile: 'CLIENTE', id_cliente: 2 });
  assert.equal(f.calls[0].skip, 10);
  assert.equal(f.calls[0].take, 10);
  assert.equal(response.data[0].pessoa.nome, 'Profissional de teste');
  assert.equal(response.data[0].pagamento.quitado, true);
  assert.equal(response.data[0].pagamento.pode_avaliar, true);
  assert.equal(response.data[0].inicio_em, '2026-11-02T01:30:00.000Z');
  assert.deepEqual(response.data[0].servicos, ['Limpeza']);
  assert.equal(JSON.stringify(response).includes('NAO_EXIBIR'), false);
  const worker = await f.service.list({}, { activeProfile: 'DIARISTA', id_diarista: 3 });
  assert.equal(worker.data[0].pessoa.nome, 'Cliente de teste');
});

test('inclui pendências antigas e encerramentos recentes sem confundir conclusão com quitação', async () => {
  const f = fixture();
  f.row.pagamento_parcela[1].status = 'Pendente';
  const response = await f.service.list({}, { activeProfile: 'CLIENTE', id_cliente: 2 });
  assert.equal(response.data[0].status, 'Concluido');
  assert.equal(response.data[0].pagamento.quitado, false);
  assert.equal(response.data[0].pagamento.pode_avaliar, false);
  const filters = f.calls[0].where.OR;
  assert.deepEqual(filters[0].status.in, ['Pendente', 'Aceito', 'Em_andamento']);
  assert.equal(filters[1].OR[0].concluido_em.gte.toISOString(), '2026-10-26T12:00:00.000Z');
  assert.equal(filters[2].respondido_em.gte.toISOString(), '2026-10-31T12:00:00.000Z');
  assert.ok(filters[1].OR.some(filter => filter.NOT));
  assert.ok(filters[1].OR.some(filter => filter.avaliacao));
});

test('diárias legadas sem preço não recebem pagamento inventado', async () => {
  const f = fixture();
  f.row.valor_estimado = null;
  const response = await f.service.list({}, { activeProfile: 'CLIENTE', id_cliente: 2 });
  assert.equal(response.data[0].pagamento, null);
});
