-- Preserva os valores legados e acrescenta os estados já utilizados pelo fluxo de check-in.
ALTER TABLE `checkin_checkout`
  MODIFY COLUMN `status_checkin` ENUM(
    'Não iniciado', 'Iniciado', 'Finalizado', 'Pago',
    'Checkin_solicitado', 'Aguardando_pagamento', 'Checkout_solicitado'
  ) NOT NULL DEFAULT 'Não iniciado';
