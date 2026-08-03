-- AlterTable
ALTER TABLE `agendamento` ADD COLUMN `criado_em` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    ADD COLUMN `endereco_snapshot` JSON NULL,
    ADD COLUMN `expira_em` DATETIME(3) NULL,
    ADD COLUMN `horario_inicio` TIME(0) NULL,
    ADD COLUMN `moeda` CHAR(3) NOT NULL DEFAULT 'BRL',
    ADD COLUMN `qtd_comodos` INTEGER NULL,
    ADD COLUMN `respondido_em` DATETIME(3) NULL,
    ADD COLUMN `tamanho_casa` ENUM('pequena', 'media', 'grande') NULL,
    ADD COLUMN `valor_adicionais` DECIMAL(10, 2) NULL,
    ADD COLUMN `valor_base` DECIMAL(10, 2) NULL,
    ADD COLUMN `valor_total_estimado` DECIMAL(10, 2) NULL,
    MODIFY `status` ENUM('Pendente', 'Aceito', 'Recusado', 'Cancelado', 'Expirado', 'Aguardando check-in', 'Check-in solicitado', 'Em andamento', 'Check-out solicitado', 'Concluido') NOT NULL DEFAULT 'Pendente';

-- AlterTable
ALTER TABLE `agendamento_servico` ADD COLUMN `descricao_snapshot` TEXT NULL,
    ADD COLUMN `nome_servico_snapshot` VARCHAR(100) NULL;

-- AlterTable
ALTER TABLE `avaliacao` ADD COLUMN `data_avaliacao` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `checkin_checkout` MODIFY `horario_checkin` TIMESTAMP(0) NULL,
    MODIFY `horario_checkout` TIMESTAMP(0) NULL;

-- AlterTable
ALTER TABLE `cliente` MODIFY `tamanho_casa` ENUM('pequena', 'media', 'grande') NOT NULL DEFAULT 'pequena';

-- AlterTable
ALTER TABLE `combo_base` ADD COLUMN `ativo` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `atualizado_em` TIMESTAMP(0) NOT NULL,
    ADD COLUMN `criado_em` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `denuncia` MODIFY `data_denuncia` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `diarista` ADD COLUMN `ativo` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `diarista_servico` ADD COLUMN `adicional` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `ativo` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `duracao_estimada_min` INTEGER NULL;

-- AlterTable
ALTER TABLE `disponibilidade_diarista` ADD COLUMN `horario_fim` TIME(0) NULL;

-- AlterTable
ALTER TABLE `endereco` ADD COLUMN `ativo` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `identificacao` VARCHAR(50) NULL,
    ADD COLUMN `latitude` DECIMAL(10, 7) NULL,
    ADD COLUMN `longitude` DECIMAL(10, 7) NULL,
    MODIFY `id_diarista` INTEGER NULL,
    MODIFY `id_cliente` INTEGER NULL;

-- AlterTable
ALTER TABLE `favorito` ADD COLUMN `criado_em` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `ocorrencia_agendamento` MODIFY `data_ocorrencia` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `usuario` ADD COLUMN `ativo` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `atualizado_em` TIMESTAMP(0) NOT NULL,
    ADD COLUMN `bloqueado` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `cpf` CHAR(11) NULL,
    ADD COLUMN `tipo` ENUM('CLIENTE', 'DIARISTA') NOT NULL DEFAULT 'CLIENTE',
    MODIFY `foto_perfil` VARCHAR(255) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `uq_agendamento_servico_item` ON `agendamento_servico`(`id_agendamento`, `diarista_servico_id_diarista_servico`);

-- CreateIndex
CREATE UNIQUE INDEX `uq_avaliacao_agendamento_cliente` ON `avaliacao`(`id_agendamento`, `id_cliente`);

-- CreateIndex
CREATE UNIQUE INDEX `uq_check_agendamento` ON `checkin_checkout`(`id_agendamento`);

-- CreateIndex
CREATE UNIQUE INDEX `uq_cliente_usuario` ON `cliente`(`id_usuario`);

-- CreateIndex
CREATE UNIQUE INDEX `uq_combo_servico` ON `combo_servico`(`id_combo_base`, `id_servico`);

-- CreateIndex
CREATE UNIQUE INDEX `uq_diarista_usuario` ON `diarista`(`id_usuario`);

-- CreateIndex
CREATE UNIQUE INDEX `uq_diarista_servico` ON `diarista_servico`(`id_diarista`, `id_servico`);

-- CreateIndex
CREATE UNIQUE INDEX `uq_disponibilidade_inicio` ON `disponibilidade_diarista`(`id_diarista`, `dia_semana`, `horario_inicio`);

-- CreateIndex
CREATE UNIQUE INDEX `uq_favorito_cliente_diarista` ON `favorito`(`id_cliente`, `id_diarista`);

-- CreateIndex
CREATE UNIQUE INDEX `uq_servico_nome` ON `servico`(`nome_servico`);

-- CreateIndex
CREATE UNIQUE INDEX `cpf` ON `usuario`(`cpf`);

