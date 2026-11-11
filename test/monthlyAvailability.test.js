import test from 'node:test';
import assert from 'node:assert/strict';
import { SaveMonthlyAvailabilityService } from '../src/services/disponibilidadeDiarista/SaveMonthlyAvailabilityService.js';
import { saveMonthlyAvailabilitySchema } from '../src/schemas/apiSchemas.js';

const parse = (dias = ['2099-01-12'], horarios = ['09:00']) => saveMonthlyAvailabilitySchema.parse({ mes: '2099-01', dias, horarios });
const slot = (id, day, time, worker = 8) => ({ id_agenda: id, id_diarista: worker, dia_semana: new Date(`${day}T00:00:00Z`), horario_inicio: new Date(`1970-01-01T${time}:00Z`), horario_fim: new Date(new Date(`1970-01-01T${time}:00Z`).getTime() + 3600000), disponivel: true });

function fixture(initial) {
  let rows = structuredClone(initial), nextId = 100, fail = false, locked = false;
  const appointments = [];
  const tx = {
    $queryRaw: async () => { locked = true; },
    disponibilidade_diarista: {
      findMany: async ({ where }) => {
        assert.equal(locked, true);
        return rows.filter((item) => item.id_diarista === where.id_diarista && item.dia_semana >= where.dia_semana.gte && item.dia_semana < where.dia_semana.lt);
      },
      deleteMany: async ({ where }) => { rows = rows.filter((item) => item.id_diarista !== where.id_diarista || !where.id_agenda.in.includes(item.id_agenda)); },
      createMany: async ({ data }) => {
        if (fail) throw new Error('Falha simulada');
        rows.push(...data.map((item) => ({ ...item, id_agenda: nextId++ })));
      },
    },
    agendamento: { findMany: async ({ where }) => appointments.filter((item) => where.status.in.includes(item.status) && item.id_diarista === where.id_diarista) },
  };
  const database = { $transaction: async (callback, options) => {
    assert.equal(options.isolationLevel, 'ReadCommitted');
    const snapshot = structuredClone(rows);
    try { return await callback(tx); }
    catch (error) { rows = snapshot; throw error; }
    finally { locked = false; }
  } };
  return { service: new SaveMonthlyAvailabilityService(database), rows: () => rows, appointments, fail: () => { fail = true; } };
}

test('edita dias e horários sem excluir horários mantidos, outros meses ou outra diarista', async () => {
  const original = [slot(1, '2099-01-12', '09:00'), slot(2, '2099-01-13', '09:00'), slot(3, '2099-02-12', '09:00'), slot(4, '2099-01-12', '09:00', 9)];
  const f = fixture(original);
  const result = await f.service.execute(parse(['2099-01-12', '2099-01-14'], ['09:00', '11:00']), { id_diarista: 8 });
  assert.equal(result.length, 4);
  assert.deepEqual(f.rows().find((item) => item.id_agenda === 1), original[0]);
  assert.equal(f.rows().some((item) => item.id_agenda === 2), false);
  assert.equal(f.rows().some((item) => item.id_agenda === 3), true);
  assert.equal(f.rows().some((item) => item.id_agenda === 4), true);
  const ids = f.rows().map((item) => item.id_agenda);
  await f.service.execute(parse(['2099-01-12', '2099-01-14'], ['09:00', '11:00']), { id_diarista: 8 });
  assert.deepEqual(f.rows().map((item) => item.id_agenda), ids, 'salvar novamente não recria registros');
});

test('alteração de 09h para 09h30 dispensa apagar o restante da agenda', async () => {
  const f = fixture([slot(1, '2099-01-12', '09:00')]);
  await f.service.execute(parse(undefined, ['09:30']), { id_diarista: 8 });
  assert.equal(f.rows().length, 1);
  assert.equal(f.rows()[0].horario_inicio.toISOString().slice(11, 16), '09:30');
});

test('falha durante a gravação restaura as disponibilidades anteriores', async () => {
  const original = [slot(1, '2099-01-12', '09:00')];
  const f = fixture(original);
  f.fail();
  await assert.rejects(() => f.service.execute(parse(undefined, ['10:00']), { id_diarista: 8 }), /Falha simulada/);
  assert.deepEqual(f.rows(), original);
});

test('não remove disponibilidade com diária aceita ou em andamento, nem altera o agendamento', async () => {
  for (const status of ['Aceito', 'Em_andamento']) {
    const original = slot(1, '2099-01-12', '09:00');
    const f = fixture([original]);
    const appointment = { ...original, data_agendamento: original.dia_semana, status };
    f.appointments.push(appointment);
    await assert.rejects(() => f.service.execute(parse([], []), { id_diarista: 8 }), (error) => error.statusCode === 409 && /12\/01\/2099 às 09:00/.test(error.message));
    assert.deepEqual(f.rows(), [original]);
    assert.deepEqual(f.appointments, [appointment]);
    await f.service.execute(parse(), { id_diarista: 8 });
  }
});

test('permite remover todos os dias livres e mantém dias passados', async () => {
  const old = slot(1, '2020-01-12', '09:00');
  const f = fixture([old, slot(2, '2099-01-12', '09:00')]);
  await f.service.execute(parse([], []), { id_diarista: 8 });
  assert.deepEqual(f.rows(), [old]);
  await assert.rejects(() => f.service.execute(saveMonthlyAvailabilitySchema.parse({ mes: '2020-01', dias: [], horarios: [] }), { id_diarista: 8 }), (error) => error.statusCode === 400);
});

test('valida dono, dias do mês, duplicidade e intervalo dos horários', async () => {
  const f = fixture([]);
  await assert.rejects(() => f.service.execute(parse(), {}), (error) => error.statusCode === 403);
  for (const changes of [
    { mes: '2099-13' }, { dias: ['2099-01-32'] }, { dias: ['2099-02-12'] },
    { dias: ['2099-01-12', '2099-01-12'] }, { horarios: ['23:00'] },
    { horarios: ['09:00', '09:30'] }, { horarios: ['09:00', '09:00'] },
    { id_diarista: 9 },
  ]) {
    assert.equal(saveMonthlyAvailabilitySchema.safeParse({ mes: '2099-01', dias: ['2099-01-12'], horarios: ['09:00'], ...changes }).success, false);
  }
});
