// A avaliação do cliente só é liberada após execução e quitação da diária.
export function canCustomerReview(appointment) {
  return appointment.status === 'Concluido'
    && ['Entrada', 'Saldo'].every(phase => appointment.pagamento_parcela?.some(
      item => item.fase === phase && item.status === 'Pago',
    ));
}
