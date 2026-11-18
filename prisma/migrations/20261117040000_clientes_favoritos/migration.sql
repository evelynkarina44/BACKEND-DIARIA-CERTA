CREATE TABLE favorito_cliente (
 id_favorito INTEGER NOT NULL AUTO_INCREMENT,
 id_cliente INTEGER NOT NULL,
 id_diarista INTEGER NOT NULL,
 PRIMARY KEY (id_favorito),
 UNIQUE INDEX uq_favorito_diarista_cliente (id_diarista,id_cliente),
 INDEX favorito_cliente_id_cliente_idx (id_cliente),
 CONSTRAINT favorito_cliente_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente) ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT favorito_cliente_id_diarista_fkey FOREIGN KEY (id_diarista) REFERENCES diarista(id_diarista) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
