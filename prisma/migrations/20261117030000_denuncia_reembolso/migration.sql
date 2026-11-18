ALTER TABLE denuncia
 ADD COLUMN id_agendamento INTEGER NULL,
 ADD COLUMN solicita_reembolso BOOLEAN NOT NULL DEFAULT false,
 ADD COLUMN reembolso_status VARCHAR(20) NOT NULL DEFAULT 'NaoSolicitado',
 ADD COLUMN reembolso_valor_pago_centavos INTEGER NULL,
 ADD INDEX denuncia_id_agendamento_solicita_reembolso_idx (id_agendamento, solicita_reembolso),
 ADD CONSTRAINT denuncia_id_agendamento_fkey FOREIGN KEY (id_agendamento) REFERENCES agendamento (id_agendamento) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE denuncia_analise ADD COLUMN decisao_reembolso VARCHAR(20) NULL;
