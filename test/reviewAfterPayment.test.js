import test from 'node:test';
import assert from 'node:assert/strict';
import { canCustomerReview } from '../src/services/avaliacao/reviewPolicy.js';
import { AvaliacaoWorkflowService } from '../src/services/avaliacao/AvaliacaoWorkflowService.js';
import { PaymentService } from '../src/services/pagamento/PaymentService.js';
import { createAvaliacaoSchema } from '../src/schemas/apiSchemas.js';

function fixture() {
  const appointment = {
    id_agendamento: 40, id_cliente: 2, id_diarista: 3, status: 'Concluido', valor_estimado: 120,
    checkin_checkout: [], avaliacao: [],
    pagamento_parcela: ['Entrada', 'Saldo'].map(fase => ({ fase, status: 'Pago', valor_centavos: 6000, transacoes: [] })),
  };
  let average;
  const database = {
    $queryRaw: async () => [],
    agendamento: { findUnique: async () => appointment },
    avaliacao: {
      findUnique: async () => appointment.avaliacao[0] ?? null,
      create: async ({ data }) => {
        const review = { id_avaliacao: 1, ...data };
        appointment.avaliacao.push(review); return review;
      },
      aggregate: async () => ({ _avg: { nota: appointment.avaliacao[0].nota } }),
    },
    diarista: { update: async ({ data }) => { average = data.avaliacao_media; } },
  };
  database.$transaction = async callback => callback(database);
  return { appointment, database, service: new AvaliacaoWorkflowService(database), average: () => average };
}

test('avaliação do cliente exige conclusão e ambas as parcelas pagas', () => {
  const f = fixture();
  assert.equal(canCustomerReview(f.appointment), true);
  for (const status of ['Aceito', 'Em_andamento', 'Cancelado', 'Recusado']) {
    assert.equal(canCustomerReview({ ...f.appointment, status }), false);
  }
  for (const status of ['Pendente', 'Falhou', 'Estornado', 'Estorno_pendente', 'Em_disputa']) {
    for (const index of [0, 1]) {
      const appointment = structuredClone(f.appointment);
      appointment.pagamento_parcela[index].status = status;
      assert.equal(canCustomerReview(appointment), false);
    }
  }
  assert.equal(canCustomerReview({ ...f.appointment, pagamento_parcela: [] }), false);
});

test('resumo libera avaliação somente enquanto não houver avaliação do cliente', () => {
  const f = fixture();
  const service = new PaymentService(f.database);
  assert.equal(service.summary(f.appointment).pode_avaliar, true);
  f.appointment.avaliacao.push({ id_avaliacao: 5, nota: '4.0', comentario: 'Bom atendimento' });
  const summary = service.summary(f.appointment);
  assert.equal(summary.pode_avaliar, false);
  assert.deepEqual(summary.avaliacao_cliente, { id_avaliacao: 5, nota: 4, comentario: 'Bom atendimento' });
});

test('cliente salva nota e comentário para a diarista e atualiza média; duplicata é rejeitada', async () => {
  const f = fixture();
  const data = { id_agendamento: 40, nota: 5, comentario: 'Pontual e cuidadosa.', publica: true, anonima: false };
  const review = await f.service.create(data, { id_cliente: 2 });
  assert.equal(review.autor_tipo, 'Cliente');
  assert.equal(review.id_diarista, 3);
  assert.equal(review.comentario, data.comentario);
  assert.equal(f.average(), 5);
  await assert.rejects(() => f.service.create(data, { id_cliente: 2 }), /já avaliou/);
  assert.equal(f.appointment.avaliacao.length, 1);
});

test('não permite avaliar diária de outro cliente, sem saldo pago ou antes do checkout', async () => {
  const f = fixture();
  const data = { id_agendamento: 40, nota: 4 };
  await assert.rejects(() => f.service.create(data, { id_cliente: 99 }), /não pertence/);
  f.appointment.pagamento_parcela[1].status = 'Pendente';
  await assert.rejects(() => f.service.create(data, { id_cliente: 2 }), /duas parcelas/);
  f.appointment.status = 'Em_andamento';
  await assert.rejects(() => f.service.create(data, { id_cliente: 2 }), /após a conclusão/);
  assert.equal(f.appointment.avaliacao.length, 0);
});

test('comentário é opcional e limitado a 2000 caracteres pela API', () => {
  assert.equal(createAvaliacaoSchema.safeParse({ id_agendamento: 40, nota: 5, comentario: null }).success, true);
  assert.equal(createAvaliacaoSchema.safeParse({ id_agendamento: 40, nota: 5, comentario: 'a'.repeat(2000) }).success, true);
  assert.equal(createAvaliacaoSchema.safeParse({ id_agendamento: 40, nota: 5, comentario: 'a'.repeat(2001) }).success, false);
});
