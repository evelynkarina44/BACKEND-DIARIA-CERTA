ALTER TABLE usuario ADD COLUMN suspenso_ate TIMESTAMP(3) NULL, ADD COLUMN excluido_em TIMESTAMP(3) NULL, ADD COLUMN versao_sessao INTEGER NOT NULL DEFAULT 0;
ALTER TABLE denuncia_analise ADD COLUMN acao VARCHAR(20) NOT NULL DEFAULT 'Nenhuma', ADD COLUMN dias_suspensao INTEGER NULL, ADD COLUMN suspenso_ate TIMESTAMP(3) NULL;
CREATE TABLE denuncia_anexo (
 id_anexo CHAR(36) NOT NULL, id_denuncia INTEGER NOT NULL, nome VARCHAR(100) NOT NULL,
 conteudo MEDIUMBLOB NOT NULL, criado_em TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 PRIMARY KEY (id_anexo), INDEX denuncia_anexo_id_denuncia_idx (id_denuncia),
 CONSTRAINT denuncia_anexo_id_denuncia_fkey FOREIGN KEY (id_denuncia) REFERENCES denuncia(id_denuncia) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
