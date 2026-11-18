// This is an administrative request only. No provider or refund queue is invoked here.
export function refundablePaidCents(appointment) {
 return (appointment.pagamento_parcela ?? []).flatMap(p => p.transacoes ?? []).reduce((sum, payment) => {
  if (payment.status !== 'approved' || payment.estorno_pendente) return sum;
  return sum + Math.max(0, payment.valor_centavos - (payment.estornado_centavos ?? 0));
 }, 0);
}
