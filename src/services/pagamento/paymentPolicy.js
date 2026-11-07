import { BadRequestError, ConflictError } from '../../errors/index.js';

export function cents(value) {
  const text = String(value);
  if (!/^\d+(\.\d{1,2})?$/.test(text)) throw new BadRequestError('Valor de pagamento inválido.');
  const [whole, fraction = ''] = text.split('.');
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(result) || result > 99999999) throw new BadRequestError('Valor de pagamento inválido.');
  return result;
}

export function splitPayment(value) {
  const total = cents(value);
  if (total < 2) throw new BadRequestError('O valor da diária deve ser de pelo menos R$ 0,02.');
  // Em totais ímpares, o centavo excedente fica no saldo. A soma nunca muda.
  const entrada = Math.floor(total / 2);
  return { entrada, saldo: total - entrada };
}

export function assertPayable(appointment, phase) {
  if (phase === 'Entrada' && appointment.status === 'Aceito') return;
  const check = appointment.checkin_checkout?.[0];
  if (phase === 'Saldo' && appointment.status === 'Concluido' && check?.horario_checkout) return;
  throw new ConflictError(phase === 'Entrada'
    ? 'A entrada só pode ser paga após o aceite da diarista e antes do início da diária.'
    : 'O saldo só pode ser pago depois do checkout da diarista.');
}

export function installmentStatus(transactions, expected) {
  const net = transactions.reduce((sum, payment) => {
    if (payment.status !== 'approved' || payment.estorno_pendente) return sum;
    return sum + payment.valor_centavos - payment.estornado_centavos;
  }, 0);
  if (net >= expected) return 'Pago';
  if (transactions.some((payment) => ['in_mediation', 'charged_back'].includes(payment.status))) return 'Em_disputa';
  if (transactions.some((payment) => payment.estornado_centavos > 0 || payment.status === 'refunded')) return 'Estornado';
  if (transactions.some((payment) => payment.estorno_pendente)) return 'Estorno_pendente';
  if (transactions.length && transactions.every((payment) => ['rejected', 'cancelled'].includes(payment.status))) return 'Falhou';
  return 'Pendente';
}
