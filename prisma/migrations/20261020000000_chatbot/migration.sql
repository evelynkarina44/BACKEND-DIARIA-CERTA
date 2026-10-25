-- Aditiva: preserva todas as tabelas e registros existentes.
CREATE TABLE `chatbot_conversa` (
  `id_conversa` CHAR(36) NOT NULL,
  `id_cliente` INTEGER NOT NULL,
  `estado` JSON NOT NULL,
  `versao` INTEGER NOT NULL DEFAULT 0,
  `criado_em` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em` TIMESTAMP(3) NOT NULL,
  INDEX `chatbot_conversa_id_cliente_atualizado_em_idx` (`id_cliente`, `atualizado_em`),
  PRIMARY KEY (`id_conversa`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `chatbot_mensagem` (
  `id_mensagem` CHAR(36) NOT NULL,
  `id_conversa` CHAR(36) NOT NULL,
  `id_requisicao` CHAR(36) NULL,
  `papel` VARCHAR(12) NOT NULL,
  `conteudo` TEXT NOT NULL,
  `fontes` JSON NULL,
  `criado_em` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `chatbot_mensagem_id_conversa_id_requisicao_key` (`id_conversa`, `id_requisicao`),
  INDEX `chatbot_mensagem_id_conversa_criado_em_idx` (`id_conversa`, `criado_em`),
  PRIMARY KEY (`id_mensagem`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `chatbot_proposta` (
  `id_proposta` CHAR(36) NOT NULL,
  `id_conversa` CHAR(36) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'Pendente',
  `payload` JSON NOT NULL,
  `resumo` JSON NOT NULL,
  `assinatura` CHAR(64) NOT NULL,
  `expira_em` TIMESTAMP(3) NOT NULL,
  `criado_em` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `id_agendamento` INTEGER NULL,
  UNIQUE INDEX `chatbot_proposta_id_agendamento_key` (`id_agendamento`),
  INDEX `chatbot_proposta_id_conversa_status_criado_em_idx` (`id_conversa`, `status`, `criado_em`),
  PRIMARY KEY (`id_proposta`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `chatbot_conversa` ADD CONSTRAINT `chatbot_conversa_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `cliente`(`id_cliente`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `chatbot_mensagem` ADD CONSTRAINT `chatbot_mensagem_id_conversa_fkey` FOREIGN KEY (`id_conversa`) REFERENCES `chatbot_conversa`(`id_conversa`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `chatbot_proposta` ADD CONSTRAINT `chatbot_proposta_id_conversa_fkey` FOREIGN KEY (`id_conversa`) REFERENCES `chatbot_conversa`(`id_conversa`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `chatbot_proposta` ADD CONSTRAINT `chatbot_proposta_id_agendamento_fkey` FOREIGN KEY (`id_agendamento`) REFERENCES `agendamento`(`id_agendamento`) ON DELETE NO ACTION ON UPDATE CASCADE;
