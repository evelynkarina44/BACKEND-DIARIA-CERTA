import test from 'node:test';
import assert from 'node:assert/strict';
import { AgendamentoWorkflowService } from '../src/services/agendamento/AgendamentoWorkflowService.js';
import { createAgendamentoSchema } from '../src/schemas/apiSchemas.js';

// Repositório e trava simulados: nenhum agendamento real é criado nestes testes.
function fixture() {
  const data = createAgendamentoSchema.parse({ id_diarista: 8, id_endereco: 2, data_agendamento: '2099-01-01', horario_inicio: '09:00', horario_fim: '10:00', qtd_comodos: 4, tamanho_residencia: 'media', servicos: [{ id_diarista_servico: 3 }] });
  const auth = { id_usuario: 1, id_cliente: 2 };
  const rows = [];
  let locked = false, tail = Promise.resolve();
  function matches(row, where) {
    return Object.entries(where).every(([key, value]) => {
      if (key === 'OR') return value.some((branch) => matches(row, branch));
      if (value instanceof Date) return row[key]?.getTime() === value.getTime();
      if (value && typeof value === 'object') {
        if ('in' in value) return value.in.includes(row[key]);
        if ('gt' in value) return row[key] != null && row[key] > value.gt;
      }
      return row[key] === value;
    });
  }
  const tx = {
    $queryRaw: async () => { locked = true; return []; },
    diarista: { findUnique: async () => ({ id_usuario: 12, usuario: { ativo: true, bloqueado: false }, combo_base: [] }) },
    endereco: { findUnique: async () => ({ id_cliente: auth.id_cliente }) },
    diarista_servico: { findMany: async () => [{ id_diarista_servico: 3, id_diarista: 8, id_servico: 4, ativo: true, preco: 100 }] },
    disponibilidade_diarista: { findMany: async () => [{ horario_inicio: data.horario_inicio, horario_fim: data.horario_fim }] },
    agendamento: {
      findMany: async ({ where }) => {
        assert.equal(locked, true, 'consulta de duplicidade deve ocorrer depois da trava');
        await Promise.resolve();
        return rows.filter((row) => matches(row, where));
      },
      create: async ({ data: input }) => {
        const row = { ...input, id_agendamento: rows.length + 1, status: 'Pendente', agendamento_servico: [] };
        rows.push(row);
        return row;
      },
    },
  };
  const database = { $transaction: (callback, options) => {
    assert.equal(options.isolationLevel, 'ReadCommitted');
    const result = tail.then(() => callback(tx));
    tail = result.catch(() => {}).finally(() => { locked = false; });
    return result;
  } };
  return { data, auth, rows, service: new AgendamentoWorkflowService(database) };
}

test('bloqueia pedido repetido, mesmo alterando serviços, combo, endereço ou observações', async () => {
  const { service, data, auth, rows } = fixture();
  await service.create(data, auth);
  for (const changes of [{}, { observacoes: 'Outro texto' }, { id_endereco: 99 }, { id_combo_base: 20 }, { servicos: [{ id_diarista_servico: 99 }] }]) {
    await assert.rejects(() => service.create({ ...data, ...changes }, auth), (error) => {
      assert.equal(error.statusCode, 409);
      assert.match(error.message, /Minhas diárias/);
      return true;
    });
  }
  assert.equal(rows.length, 1);
});

test('20 envios concorrentes do mesmo pedido criam somente uma solicitação', async () => {
  const { service, data, auth, rows } = fixture();
  const results = await Promise.allSettled(Array.from({ length: 20 }, () => service.create(data, auth)));
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(results.filter((result) => result.status === 'rejected' && result.reason.statusCode === 409).length, 19);
  assert.equal(rows.length, 1);
});

test('clientes diferentes podem enviar pedidos pendentes para o mesmo horário', async () => {
  const { service, data, auth, rows } = fixture();
  await service.create(data, auth);
  auth.id_cliente = 7;
  await service.create(data, auth);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((row) => row.id_cliente), [2, 7]);
});

test('outro dia, horário ou diarista não é duplicidade', async () => {
  for (const changes of [
    { data_agendamento: new Date('2099-01-02T00:00:00Z') },
    { horario_inicio: new Date('1970-01-01T08:00:00Z') },
    { id_diarista: 9 },
  ]) {
    const { service, data, auth, rows } = fixture();
    await service.create(data, auth);
    Object.assign(rows[0], changes);
    await service.create(data, auth);
    assert.equal(rows.length, 2);
  }
});

test('recusa, cancelamento e expiração permitem reenviar; pedidos ativos não', async () => {
  for (const status of ['Recusado', 'Cancelado', 'Expirado', 'Pendente', 'Aceito', 'Em_andamento']) {
    const { service, data, auth, rows } = fixture();
    await service.create(data, auth);
    rows[0].status = status;
    if (['Recusado', 'Cancelado', 'Expirado'].includes(status)) {
      await service.create(data, auth);
      assert.equal(rows.length, 2);
    } else {
      await assert.rejects(() => service.create(data, auth), /já possui uma solicitação/);
      assert.equal(rows.length, 1);
    }
  }
  // Expiração já vencida não depende de alguém abrir a lista para permitir novo envio.
  const { service, data, auth, rows } = fixture();
  await service.create(data, auth);
  rows[0].expira_em = new Date(0);
  await service.create(data, auth);
  assert.equal(rows.length, 2);
});

test('cliente autenticado é obrigatório antes de abrir a transação', async () => {
  const { service, data } = fixture();
  await assert.rejects(() => service.create(data, {}), (error) => error.statusCode === 403);
});
