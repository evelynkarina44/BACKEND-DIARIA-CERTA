// Executar na mesma transação da criação e depois da trava da diarista.
// O contador permanente impede reutilização até se um registro for removido.
export async function nextWorkerBookingNumber(database, idDiarista) {
  const worker = await database.diarista.update({
    where: { id_diarista: idDiarista },
    data: { ultimo_numero_diaria: { increment: 1 } },
    select: { ultimo_numero_diaria: true },
  });
  return worker.ultimo_numero_diaria;
}
