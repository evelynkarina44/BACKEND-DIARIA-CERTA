ALTER TABLE usuario ADD COLUMN administrador BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE denuncia ADD COLUMN status ENUM('Pendente','EmAnalise','Resolvida','Arquivada') NOT NULL DEFAULT 'Pendente', ADD COLUMN versao INTEGER NOT NULL DEFAULT 0;
CREATE TABLE denuncia_analise (
  id_analise INTEGER NOT NULL AUTO_INCREMENT,
  id_denuncia INTEGER NOT NULL,
  id_administrador INTEGER NOT NULL,
  status ENUM('Pendente','EmAnalise','Resolvida','Arquivada') NOT NULL,
  observacao TEXT NOT NULL,
  criado_em TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_analise),
  INDEX denuncia_analise_id_denuncia_criado_em_idx (id_denuncia, criado_em),
  INDEX denuncia_analise_id_administrador_idx (id_administrador),
  CONSTRAINT denuncia_analise_id_denuncia_fkey FOREIGN KEY (id_denuncia) REFERENCES denuncia(id_denuncia) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT denuncia_analise_id_administrador_fkey FOREIGN KEY (id_administrador) REFERENCES usuario(id_usuario) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
