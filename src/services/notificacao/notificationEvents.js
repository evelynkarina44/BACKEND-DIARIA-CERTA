import { createHash } from 'node:crypto';
import { combineDateAndTime } from '../../utils/dateTime.js';

// Um ID por evento de negócio: consultas e webhooks repetidos não recriam avisos.
export function notificationEvents(a, profile, now = new Date()) {
  const customer = profile === 'CLIENTE';
  const reference = 'Diária #' + a.id_agendamento + ' de ' + a.data_agendamento.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  const events = [];
  const target = customer ? 'pagamento' : 'diaria';
  function add(kind, title, message, date, action = target) {
    if (!date) return;
    const time = new Date(date);
    if (!Number.isFinite(time.getTime()) || time > now) return;
    events.push({ id: createHash('sha256').update(a.id_agendamento + ':' + profile + ':' + kind).digest('hex'),
      id_agendamento: a.id_agendamento, tipo: kind, titulo: title, mensagem: reference + '. ' + message,
      criado_em: time.toISOString(), acao: action });
  }
  add('solicitacao', customer ? 'Solicitação enviada' : 'Nova solicitação de diária',
    customer ? 'Aguarde a resposta da diarista.' : 'Confira os serviços e aceite ou recuse a solicitação.',
    a.solicitado_em, customer ? 'pagamento' : 'acompanhar');
  if (['Aceito', 'Em_andamento', 'Concluido'].includes(a.status)) add('aceite', 'Solicitação aceita',
    customer ? 'A entrada de 50% já pode ser paga.' : 'Aguarde o pagamento da entrada pelo cliente.', a.respondido_em);
  const ending = { Recusado: 'Solicitação recusada', Cancelado: 'Agendamento cancelado', Expirado: 'Solicitação expirada' };
  if (ending[a.status]) add(a.status.toLowerCase(), ending[a.status], 'Consulte a situação do agendamento.', a.respondido_em);
  const parts = a.pagamento_parcela ?? [];
  const entryPaid = parts.some(p => p.fase === 'Entrada' && p.status === 'Pago');
  const fullyPaid = ['Entrada', 'Saldo'].every(phase => parts.some(p => p.fase === phase && p.status === 'Pago'));
  for (const p of parts) {
    const approved = (p.transacoes ?? []).filter(t => t.status === 'approved' && !t.estorno_pendente && t.estornado_centavos < t.valor_centavos)
      .sort((x, y) => new Date(x.criado_em) - new Date(y.criado_em))[0];
    if (p.status === 'Pago') {
      const final = p.fase === 'Saldo' && fullyPaid;
      add(p.fase + '-pago', final ? 'Pagamento integral confirmado' : p.fase === 'Entrada' ? 'Entrada de 50% confirmada' : 'Saldo de 50% confirmado',
        final ? customer ? 'As duas parcelas foram aprovadas. Confira a avaliação da diarista.' : 'As duas parcelas foram aprovadas; os valores são recebidos pela plataforma.'
          : p.fase === 'Saldo' ? 'O saldo desta parcela foi aprovado. Confira a situação das duas parcelas.' : customer ? 'Aguarde o check-in no horário combinado.' : 'O cliente pagou a entrada. O check-in será liberado no horário combinado.',
        approved?.criado_em ?? p.atualizado_em, final && customer && a.status === 'Concluido' && !(a.avaliacao ?? []).length ? 'avaliacao' : target);
    }
    if (p.status === 'Estorno_pendente' || p.transacoes?.some(t => t.estorno_pendente)) add(p.fase + '-estorno-pendente', 'Estorno em processamento', 'A devolução depende do processamento do Mercado Pago.', p.atualizado_em);
    if (p.status === 'Estornado') add(p.fase + '-estornado', 'Pagamento estornado', 'O provedor confirmou o estorno desta parcela.', p.atualizado_em);
    if (p.status === 'Em_disputa') add(p.fase + '-analise', 'Pagamento em análise', 'Consulte os detalhes do pagamento.', p.atualizado_em);
  }
  const check = a.checkin_checkout?.[0];
  add('checkin', 'Check-in realizado', 'A diarista registrou o início do serviço.', check?.horario_checkin);
  add('checkout', 'Diária finalizada', customer ? 'A diarista registrou o checkout. Consulte o pagamento dos 50% restantes.' : 'Checkout registrado. Aguarde o cliente pagar o saldo.', check?.horario_checkout);
  if (a.status === 'Aceito' && entryPaid && a.horario_inicio) add('horario-checkin',
    customer ? 'Horário da sua diária' : 'Hora de realizar o check-in',
    customer ? 'Aguarde o registro de início pela diarista.' : 'A entrada está paga. Abra a diária para registrar o início.',
    combineDateAndTime(a.data_agendamento, a.horario_inicio));
  add('avaliacao', customer ? 'Avaliação registrada' : 'Você recebeu uma avaliação',
    customer ? 'Sua avaliação da diarista foi salva.' : 'O cliente avaliou o serviço desta diária.', a.avaliacao?.[0]?.data_avaliacao);
  return events;
}
