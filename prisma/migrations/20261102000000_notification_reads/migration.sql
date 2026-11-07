CREATE TABLE `notificacao_leitura` (
  `id_usuario` INTEGER NOT NULL,
  `perfil` ENUM('CLIENTE','DIARISTA') NOT NULL,
  `chave_evento` CHAR(64) NOT NULL,
  `lida_em` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id_usuario`, `perfil`, `chave_evento`),
  CONSTRAINT `fk_notificacao_leitura_usuario` FOREIGN KEY (`id_usuario`)
    REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
