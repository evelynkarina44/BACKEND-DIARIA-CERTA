ALTER TABLE `denuncia_anexo`
 ADD COLUMN `tipo` VARCHAR(10) NOT NULL DEFAULT 'image',
 ADD COLUMN `mime` VARCHAR(40) NOT NULL DEFAULT 'image/jpeg',
 ADD COLUMN `chave_cliente` VARCHAR(80) NULL,
 ADD UNIQUE INDEX `denuncia_anexo_id_denuncia_chave_cliente_key` (`id_denuncia`, `chave_cliente`);

CREATE TABLE `avaliacao_anexo` (
 `id_anexo` CHAR(36) NOT NULL,
 `id_avaliacao` INTEGER NOT NULL,
 `nome` VARCHAR(100) NOT NULL,
 `tipo` VARCHAR(10) NOT NULL,
 `mime` VARCHAR(40) NOT NULL,
 `chave_cliente` VARCHAR(80) NULL,
 `conteudo` MEDIUMBLOB NOT NULL,
 `criado_em` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 PRIMARY KEY (`id_anexo`),
 INDEX `avaliacao_anexo_id_avaliacao_idx` (`id_avaliacao`),
 UNIQUE INDEX `avaliacao_anexo_id_avaliacao_chave_cliente_key` (`id_avaliacao`, `chave_cliente`),
 CONSTRAINT `avaliacao_anexo_id_avaliacao_fkey` FOREIGN KEY (`id_avaliacao`) REFERENCES `avaliacao` (`id_avaliacao`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
