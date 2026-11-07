CREATE TABLE `pagamento_parcela` (
  `id_parcela` CHAR(36) NOT NULL,
  `id_agendamento` INTEGER NOT NULL,
  `fase` VARCHAR(10) NOT NULL,
  `valor_centavos` INTEGER NOT NULL,
  `status` VARCHAR(24) NOT NULL DEFAULT 'Pendente',
  `id_preferencia` VARCHAR(100) NULL,
  `checkout_url` VARCHAR(500) NULL,
  `expira_em` TIMESTAMP(3) NULL,
  `criacao_em` TIMESTAMP(3) NULL,
  `criado_em` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em` TIMESTAMP(3) NOT NULL,
  UNIQUE INDEX `pagamento_parcela_id_agendamento_fase_key` (`id_agendamento`, `fase`),
  PRIMARY KEY (`id_parcela`),
  CONSTRAINT `pagamento_parcela_id_agendamento_fkey` FOREIGN KEY (`id_agendamento`) REFERENCES `agendamento` (`id_agendamento`) ON DELETE NO ACTION ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pagamento_transacao` (
  `id_pagamento` VARCHAR(100) NOT NULL,
  `id_parcela` CHAR(36) NOT NULL,
  `status` VARCHAR(40) NOT NULL,
  `valor_centavos` INTEGER NOT NULL,
  `estornado_centavos` INTEGER NOT NULL DEFAULT 0,
  `provedor_atualizado_em` TIMESTAMP(3) NOT NULL,
  `estorno_pendente` BOOLEAN NOT NULL DEFAULT false,
  `criado_em` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em` TIMESTAMP(3) NOT NULL,
  INDEX `pagamento_transacao_id_parcela_idx` (`id_parcela`),
  INDEX `pagamento_transacao_estorno_pendente_idx` (`estorno_pendente`),
  PRIMARY KEY (`id_pagamento`),
  CONSTRAINT `pagamento_transacao_id_parcela_fkey` FOREIGN KEY (`id_parcela`) REFERENCES `pagamento_parcela` (`id_parcela`) ON DELETE NO ACTION ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
