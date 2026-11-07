import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import prisma from '../src/lib/prisma.js';
import { NotificationService } from '../src/services/notificacao/NotificationService.js';

test('MySQL: leitura persiste entre instâncias, separa perfis e não marca avisos futuros; tudo revertido', {
  skip: process.env.RUN_NOTIFICATION_DATABASE_TESTS !== '1',
}, async () => {
  const rollback = new Error('ROLLBACK_NOTIFICATION_FIXTURES');
  try {
    await assert.rejects(prisma.$transaction(async tx => {
      const suffix = randomUUID();
      const user = await tx.usuario.create({ data: { nome: 'Teste notificações', email: suffix + '@example.com', senha: 'HASH_FICTICIO_TESTE', telefone: '11999999999', tipo: 'AMBOS' } });
      const customer = await tx.cliente.create({ data: { id_usuario: user.id_usuario, data_nascimento: new Date('2000-01-01'), qtd_comodos: 3 } });
      const worker = await tx.diarista.create({ data: { id_usuario: user.id_usuario, descricao: 'Teste revertido', qtd_max_comodos: 5 } });
      // Fixture apenas para testar isolamento de leitura no mesmo usuário, não contratação real.
      const appointment = await tx.agendamento.create({ data: {
        id_cliente: customer.id_cliente, id_diarista: worker.id_diarista, data_agendamento: new Date('2026-11-02'),
        status: 'Aceito', solicitado_em: new Date(Date.now() - 60000), respondido_em: new Date(Date.now() - 30000),
      } });
      const clientAuth = { id_usuario: user.id_usuario, activeProfile: 'CLIENTE', id_cliente: customer.id_cliente };
      const workerAuth = { id_usuario: user.id_usuario, activeProfile: 'DIARISTA', id_diarista: worker.id_diarista };
      const service = new NotificationService(tx);
      const first = await service.list({}, clientAuth);
      assert.equal(first.nao_lidas, 2);
      await service.markRead(first.data[0].id, clientAuth);
      assert.equal((await new NotificationService(tx).list({}, clientAuth)).nao_lidas, 1);
      assert.equal((await service.list({}, workerAuth)).nao_lidas, 2);
      await service.markAll(clientAuth);
      assert.equal((await service.list({}, clientAuth)).nao_lidas, 0);
      assert.equal((await service.list({}, workerAuth)).nao_lidas, 2);
      // TIMESTAMP(0) pode arredondar para o próximo segundo no MySQL.
      await tx.checkin_checkout.create({ data: { id_agendamento: appointment.id_agendamento, status_checkin: 'Iniciado', horario_checkin: new Date(Date.now() - 2000) } });
      await tx.agendamento.update({ where: { id_agendamento: appointment.id_agendamento }, data: { status: 'Em_andamento' } });
      const next = await service.list({}, clientAuth);
      assert.equal(next.nao_lidas, 1);
      assert.equal(next.data.find(item => item.tipo === 'checkin').lida, false);
      throw rollback;
    }, { timeout: 20000 }), error => error === rollback);
  } finally { await prisma.$disconnect(); }
});
