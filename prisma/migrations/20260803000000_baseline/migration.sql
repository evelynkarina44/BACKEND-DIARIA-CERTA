-- CreateTable
CREATE TABLE `agendamento` (
    `id_agendamento` INTEGER NOT NULL AUTO_INCREMENT,
    `id_cliente` INTEGER NOT NULL,
    `id_diarista` INTEGER NOT NULL,
    `data_agendamento` DATE NOT NULL,
    `observacoes` TEXT NULL,
    `status` ENUM('Aceito', 'Cancelado', 'Pendente') NOT NULL DEFAULT 'Pendente',

    INDEX `fk_agendamento_cliente`(`id_cliente` ASC),
    INDEX `fk_agendamento_diarista`(`id_diarista` ASC),
    PRIMARY KEY (`id_agendamento` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agendamento_servico` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_agendamento` INTEGER NOT NULL,
    `preco` DECIMAL(8, 2) NOT NULL,
    `diarista_servico_id_diarista_servico` INTEGER NOT NULL,

    INDEX `fk_ag_serv_agendamento`(`id_agendamento` ASC),
    INDEX `fk_agendamento_servico_diarista_servico1_idx`(`diarista_servico_id_diarista_servico` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `avaliacao` (
    `id_avaliacao` INTEGER NOT NULL AUTO_INCREMENT,
    `id_agendamento` INTEGER NOT NULL,
    `id_cliente` INTEGER NOT NULL,
    `id_diarista` INTEGER NOT NULL,
    `nota` DECIMAL(2, 1) NOT NULL,
    `comentario` TEXT NULL,
    `comentario_publico` BOOLEAN NULL,
    `comentario_privado` BOOLEAN NULL,

    INDEX `fk_avaliacao_agendamento`(`id_agendamento` ASC),
    INDEX `fk_avaliacao_cliente`(`id_cliente` ASC),
    INDEX `fk_avaliacao_diarista`(`id_diarista` ASC),
    PRIMARY KEY (`id_avaliacao` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `checkin_checkout` (
    `id_check` INTEGER NOT NULL AUTO_INCREMENT,
    `id_agendamento` INTEGER NOT NULL,
    `horario_checkin` TIMESTAMP(0) NOT NULL,
    `horario_checkout` TIMESTAMP(0) NOT NULL,
    `status_checkin` ENUM('Não iniciado', 'Iniciado', 'Finalizado', 'Pago') NOT NULL DEFAULT 'Não iniciado',

    INDEX `fk_check_agendamento`(`id_agendamento` ASC),
    PRIMARY KEY (`id_check` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cliente` (
    `id_cliente` INTEGER NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER NOT NULL,
    `data_nascimento` DATE NOT NULL,
    `qtd_comodos` INTEGER NOT NULL,
    `tamanho_casa` ENUM('pequena', 'média', 'grande') NOT NULL DEFAULT 'pequena',

    INDEX `fk_cliente_usuario`(`id_usuario` ASC),
    PRIMARY KEY (`id_cliente` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `combo_base` (
    `id_combo_base` INTEGER NOT NULL AUTO_INCREMENT,
    `id_diarista` INTEGER NOT NULL,
    `nome_combo` VARCHAR(100) NOT NULL,
    `valor_base` DECIMAL(8, 2) NOT NULL,
    `descricao` TEXT NULL,
    `qtd_comodos_casa` INTEGER NOT NULL,
    `atende_casa_pequena` BOOLEAN NULL,
    `atende_casa_media` BOOLEAN NULL,
    `atende_casa_grande` BOOLEAN NULL,

    INDEX `fk_combo_diarista`(`id_diarista` ASC),
    PRIMARY KEY (`id_combo_base` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `combo_servico` (
    `id_combo_servico` INTEGER NOT NULL AUTO_INCREMENT,
    `id_servico` INTEGER NOT NULL,
    `id_combo_base` INTEGER NOT NULL,

    INDEX `fk_combo_servico_combo`(`id_combo_base` ASC),
    INDEX `fk_combo_servico_servico`(`id_servico` ASC),
    PRIMARY KEY (`id_combo_servico` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `denuncia` (
    `id_denuncia` INTEGER NOT NULL AUTO_INCREMENT,
    `id_usuario_denunciante` INTEGER NOT NULL,
    `id_usuario_denunciado` INTEGER NOT NULL,
    `motivo` ENUM('spam', 'fraude', 'comportamento_inadequado', 'outro') NOT NULL,
    `descricao` TEXT NULL,
    `data_denuncia` TIMESTAMP(0) NOT NULL,

    INDEX `fk_denuncia_denunciado`(`id_usuario_denunciado` ASC),
    INDEX `fk_denuncia_denunciante`(`id_usuario_denunciante` ASC),
    PRIMARY KEY (`id_denuncia` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `diarista` (
    `id_diarista` INTEGER NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER NOT NULL,
    `descricao` TEXT NOT NULL,
    `frequencia_resposta` VARCHAR(50) NULL,
    `qtd_max_comodos` INTEGER NOT NULL,
    `avaliacao_media` DECIMAL(3, 2) NULL,

    INDEX `fk_diarista_usuario`(`id_usuario` ASC),
    PRIMARY KEY (`id_diarista` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `diarista_servico` (
    `id_diarista_servico` INTEGER NOT NULL AUTO_INCREMENT,
    `id_diarista` INTEGER NOT NULL,
    `id_servico` INTEGER NOT NULL,
    `preco` DECIMAL(8, 2) NOT NULL,
    `faz_parte_combo_base` BOOLEAN NULL,

    INDEX `fk_ds_diarista`(`id_diarista` ASC),
    INDEX `fk_ds_servico`(`id_servico` ASC),
    PRIMARY KEY (`id_diarista_servico` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `disponibilidade_diarista` (
    `id_agenda` INTEGER NOT NULL AUTO_INCREMENT,
    `id_diarista` INTEGER NOT NULL,
    `dia_semana` DATE NOT NULL,
    `horario_inicio` TIME(0) NOT NULL,
    `disponivel` BOOLEAN NOT NULL,

    INDEX `fk_disponibilidade_diarista`(`id_diarista` ASC),
    PRIMARY KEY (`id_agenda` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `endereco` (
    `id_endereco` INTEGER NOT NULL AUTO_INCREMENT,
    `id_diarista` INTEGER NOT NULL,
    `id_cliente` INTEGER NOT NULL,
    `bairro` VARCHAR(100) NOT NULL,
    `cep` VARCHAR(9) NOT NULL,
    `logradouro` VARCHAR(150) NOT NULL,
    `numero` INTEGER NOT NULL,
    `complemento` VARCHAR(100) NULL,
    `cidade` VARCHAR(100) NOT NULL,
    `estado` CHAR(2) NOT NULL,
    `referencia` VARCHAR(150) NULL,

    INDEX `fk_endereco_cliente`(`id_cliente` ASC),
    INDEX `fk_endereco_diarista`(`id_diarista` ASC),
    PRIMARY KEY (`id_endereco` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `favorito` (
    `id_favorito` INTEGER NOT NULL AUTO_INCREMENT,
    `id_cliente` INTEGER NOT NULL,
    `id_diarista` INTEGER NOT NULL,

    INDEX `fk_favorito_cliente`(`id_cliente` ASC),
    INDEX `fk_favorito_diarista`(`id_diarista` ASC),
    PRIMARY KEY (`id_favorito` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ocorrencia_agendamento` (
    `id_ocorrencia` INTEGER NOT NULL AUTO_INCREMENT,
    `id_agendamento` INTEGER NOT NULL,
    `motivo` ENUM('cancelamento', 'atraso', 'problema', 'outro') NOT NULL,
    `descricao` TEXT NULL,
    `data_ocorrencia` TIMESTAMP(0) NOT NULL,

    INDEX `fk_ocorrencia_agendamento`(`id_agendamento` ASC),
    PRIMARY KEY (`id_ocorrencia` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `servico` (
    `id_servico` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_servico` VARCHAR(100) NOT NULL,
    `descricao` TEXT NULL,

    PRIMARY KEY (`id_servico` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuario` (
    `id_usuario` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `senha` VARCHAR(255) NOT NULL,
    `telefone` VARCHAR(20) NOT NULL,
    `foto_perfil` VARCHAR(255) NOT NULL,
    `data_cadastro` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `email`(`email` ASC),
    PRIMARY KEY (`id_usuario` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `agendamento` ADD CONSTRAINT `fk_agendamento_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `cliente`(`id_cliente`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `agendamento` ADD CONSTRAINT `fk_agendamento_diarista` FOREIGN KEY (`id_diarista`) REFERENCES `diarista`(`id_diarista`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `agendamento_servico` ADD CONSTRAINT `fk_ag_serv_agendamento` FOREIGN KEY (`id_agendamento`) REFERENCES `agendamento`(`id_agendamento`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `agendamento_servico` ADD CONSTRAINT `fk_agendamento_servico_diarista_servico1` FOREIGN KEY (`diarista_servico_id_diarista_servico`) REFERENCES `diarista_servico`(`id_diarista_servico`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `avaliacao` ADD CONSTRAINT `fk_avaliacao_agendamento` FOREIGN KEY (`id_agendamento`) REFERENCES `agendamento`(`id_agendamento`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `avaliacao` ADD CONSTRAINT `fk_avaliacao_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `cliente`(`id_cliente`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `avaliacao` ADD CONSTRAINT `fk_avaliacao_diarista` FOREIGN KEY (`id_diarista`) REFERENCES `diarista`(`id_diarista`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `checkin_checkout` ADD CONSTRAINT `fk_check_agendamento` FOREIGN KEY (`id_agendamento`) REFERENCES `agendamento`(`id_agendamento`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `cliente` ADD CONSTRAINT `fk_cliente_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario`(`id_usuario`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `combo_base` ADD CONSTRAINT `fk_combo_diarista` FOREIGN KEY (`id_diarista`) REFERENCES `diarista`(`id_diarista`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `combo_servico` ADD CONSTRAINT `fk_combo_servico_combo` FOREIGN KEY (`id_combo_base`) REFERENCES `combo_base`(`id_combo_base`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `combo_servico` ADD CONSTRAINT `fk_combo_servico_servico` FOREIGN KEY (`id_servico`) REFERENCES `servico`(`id_servico`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `denuncia` ADD CONSTRAINT `fk_denuncia_denunciado` FOREIGN KEY (`id_usuario_denunciado`) REFERENCES `usuario`(`id_usuario`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `denuncia` ADD CONSTRAINT `fk_denuncia_denunciante` FOREIGN KEY (`id_usuario_denunciante`) REFERENCES `usuario`(`id_usuario`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `diarista` ADD CONSTRAINT `fk_diarista_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario`(`id_usuario`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `diarista_servico` ADD CONSTRAINT `fk_ds_diarista` FOREIGN KEY (`id_diarista`) REFERENCES `diarista`(`id_diarista`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `diarista_servico` ADD CONSTRAINT `fk_ds_servico` FOREIGN KEY (`id_servico`) REFERENCES `servico`(`id_servico`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `disponibilidade_diarista` ADD CONSTRAINT `fk_disponibilidade_diarista` FOREIGN KEY (`id_diarista`) REFERENCES `diarista`(`id_diarista`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `endereco` ADD CONSTRAINT `fk_endereco_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `cliente`(`id_cliente`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `endereco` ADD CONSTRAINT `fk_endereco_diarista` FOREIGN KEY (`id_diarista`) REFERENCES `diarista`(`id_diarista`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `favorito` ADD CONSTRAINT `fk_favorito_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `cliente`(`id_cliente`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `favorito` ADD CONSTRAINT `fk_favorito_diarista` FOREIGN KEY (`id_diarista`) REFERENCES `diarista`(`id_diarista`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `ocorrencia_agendamento` ADD CONSTRAINT `fk_ocorrencia_agendamento` FOREIGN KEY (`id_agendamento`) REFERENCES `agendamento`(`id_agendamento`) ON DELETE NO ACTION ON UPDATE NO ACTION;

