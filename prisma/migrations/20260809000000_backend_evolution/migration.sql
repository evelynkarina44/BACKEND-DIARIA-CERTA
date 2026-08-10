-- Esta migration pressupõe que não existam duplicidades nas chaves únicas
-- adicionadas. Revise e saneie dados legados antes de aplicá-la em produção.

ALTER TABLE `agendamento`
  ADD COLUMN `id_endereco` INTEGER NULL,
  ADD COLUMN `horario_inicio` TIME(0) NULL,
  ADD COLUMN `horario_fim` TIME(0) NULL,
  ADD COLUMN `qtd_comodos` INTEGER NULL,
  ADD COLUMN `tamanho_residencia` ENUM('pequena', 'media', 'grande') NULL,
  ADD COLUMN `valor_estimado` DECIMAL(8, 2) NULL,
  ADD COLUMN `solicitado_em` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN `expira_em` TIMESTAMP(0) NULL,
  ADD COLUMN `respondido_em` TIMESTAMP(0) NULL,
  ADD COLUMN `concluido_em` TIMESTAMP(0) NULL,
  MODIFY COLUMN `status` ENUM(
    'Aceito',
    'Cancelado',
    'Pendente',
    'Recusado',
    'Expirado',
    'Em_andamento',
    'Concluido'
  ) NOT NULL DEFAULT 'Pendente',
  ADD INDEX `fk_agendamento_endereco` (`id_endereco`),
  ADD INDEX `idx_agendamento_status_expiracao` (`status`, `expira_em`),
  ADD INDEX `idx_agendamento_diarista_data` (`id_diarista`, `data_agendamento`),
  ADD CONSTRAINT `fk_agendamento_endereco`
    FOREIGN KEY (`id_endereco`) REFERENCES `endereco` (`id_endereco`)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `agendamento_servico`
  ADD CONSTRAINT `uq_agendamento_servico`
  UNIQUE (`id_agendamento`, `diarista_servico_id_diarista_servico`);

ALTER TABLE `avaliacao`
  ADD COLUMN `autor_tipo` ENUM('Cliente', 'Diarista') NOT NULL DEFAULT 'Cliente',
  ADD COLUMN `anonima` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `data_avaliacao` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD CONSTRAINT `uq_avaliacao_agendamento_autor`
  UNIQUE (`id_agendamento`, `autor_tipo`);

ALTER TABLE `checkin_checkout`
  ADD COLUMN `status_pagamento` ENUM('Pendente', 'Pago', 'Falhou') NOT NULL DEFAULT 'Pendente',
  ADD COLUMN `pagamento_em` TIMESTAMP(0) NULL,
  MODIFY COLUMN `horario_checkin` TIMESTAMP(0) NULL,
  MODIFY COLUMN `horario_checkout` TIMESTAMP(0) NULL;

UPDATE `checkin_checkout`
SET `status_pagamento` = 'Pago', `status_checkin` = 'Iniciado'
WHERE `status_checkin` = 'Pago';

ALTER TABLE `checkin_checkout`
  MODIFY COLUMN `status_checkin` ENUM(
    'Não iniciado',
    'Checkin_solicitado',
    'Aguardando_pagamento',
    'Iniciado',
    'Checkout_solicitado',
    'Finalizado'
  ) NOT NULL DEFAULT 'Não iniciado',
  ADD CONSTRAINT `uq_checkin_checkout_agendamento` UNIQUE (`id_agendamento`);

ALTER TABLE `cliente`
  ADD CONSTRAINT `uq_cliente_usuario` UNIQUE (`id_usuario`);

ALTER TABLE `combo_servico`
  ADD CONSTRAINT `uq_combo_servico` UNIQUE (`id_combo_base`, `id_servico`);

ALTER TABLE `denuncia`
  MODIFY COLUMN `data_denuncia` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE `diarista`
  ADD CONSTRAINT `uq_diarista_usuario` UNIQUE (`id_usuario`);

ALTER TABLE `diarista_servico`
  ADD CONSTRAINT `uq_diarista_servico` UNIQUE (`id_diarista`, `id_servico`);

ALTER TABLE `disponibilidade_diarista`
  ADD COLUMN `horario_fim` TIME(0) NULL,
  ADD CONSTRAINT `uq_disponibilidade_inicio`
  UNIQUE (`id_diarista`, `dia_semana`, `horario_inicio`);

ALTER TABLE `endereco`
  MODIFY COLUMN `id_diarista` INTEGER NULL,
  MODIFY COLUMN `id_cliente` INTEGER NULL;

ALTER TABLE `favorito`
  ADD CONSTRAINT `uq_favorito_cliente_diarista`
  UNIQUE (`id_cliente`, `id_diarista`);

ALTER TABLE `ocorrencia_agendamento`
  MODIFY COLUMN `data_ocorrencia` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP;
