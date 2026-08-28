-- Reparo idempotente para bancos legados cuja tabela agendamento ficou
-- parcialmente desalinhada do schema Prisma atual.

SET @sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'agendamento' AND COLUMN_NAME = 'id_endereco') = 0,
  'ALTER TABLE `agendamento` ADD COLUMN `id_endereco` INTEGER NULL', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'checkin_checkout' AND COLUMN_NAME = 'status_pagamento') = 0,
  'ALTER TABLE `checkin_checkout` ADD COLUMN `status_pagamento` ENUM(''Pendente'', ''Pago'', ''Falhou'') NOT NULL DEFAULT ''Pendente''', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'checkin_checkout' AND COLUMN_NAME = 'pagamento_em') = 0,
  'ALTER TABLE `checkin_checkout` ADD COLUMN `pagamento_em` TIMESTAMP(0) NULL', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'agendamento' AND COLUMN_NAME = 'horario_fim') = 0,
  'ALTER TABLE `agendamento` ADD COLUMN `horario_fim` TIME(0) NULL', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'agendamento' AND COLUMN_NAME = 'tamanho_residencia') = 0,
  'ALTER TABLE `agendamento` ADD COLUMN `tamanho_residencia` ENUM(''pequena'', ''media'', ''grande'') NULL', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'agendamento' AND COLUMN_NAME = 'valor_estimado') = 0,
  'ALTER TABLE `agendamento` ADD COLUMN `valor_estimado` DECIMAL(8, 2) NULL', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'agendamento' AND COLUMN_NAME = 'solicitado_em') = 0,
  'ALTER TABLE `agendamento` ADD COLUMN `solicitado_em` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'agendamento' AND COLUMN_NAME = 'concluido_em') = 0,
  'ALTER TABLE `agendamento` ADD COLUMN `concluido_em` TIMESTAMP(0) NULL', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE `agendamento` MODIFY COLUMN `status` ENUM(
  'Aceito', 'Cancelado', 'Pendente', 'Recusado', 'Expirado', 'Em_andamento', 'Concluido',
  'Aguardando check-in', 'Check-in solicitado', 'Em andamento', 'Check-out solicitado'
) NOT NULL DEFAULT 'Pendente';

UPDATE `agendamento` SET `status` = 'Aceito' WHERE `status` = 'Aguardando check-in';
UPDATE `agendamento` SET `status` = 'Em_andamento' WHERE `status` IN ('Check-in solicitado', 'Em andamento', 'Check-out solicitado');

ALTER TABLE `agendamento` MODIFY COLUMN `status` ENUM(
  'Aceito', 'Cancelado', 'Pendente', 'Recusado', 'Expirado', 'Em_andamento', 'Concluido'
) NOT NULL DEFAULT 'Pendente';

SET @sql = IF((SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'agendamento' AND INDEX_NAME = 'fk_agendamento_endereco') = 0,
  'ALTER TABLE `agendamento` ADD INDEX `fk_agendamento_endereco` (`id_endereco`)', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'agendamento' AND INDEX_NAME = 'idx_agendamento_status_expiracao') = 0,
  'ALTER TABLE `agendamento` ADD INDEX `idx_agendamento_status_expiracao` (`status`, `expira_em`)', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'agendamento' AND INDEX_NAME = 'idx_agendamento_diarista_data') = 0,
  'ALTER TABLE `agendamento` ADD INDEX `idx_agendamento_diarista_data` (`id_diarista`, `data_agendamento`)', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'agendamento' AND CONSTRAINT_NAME = 'fk_agendamento_endereco' AND REFERENCED_TABLE_NAME = 'endereco') = 0,
  'ALTER TABLE `agendamento` ADD CONSTRAINT `fk_agendamento_endereco` FOREIGN KEY (`id_endereco`) REFERENCES `endereco` (`id_endereco`) ON DELETE NO ACTION ON UPDATE NO ACTION', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
