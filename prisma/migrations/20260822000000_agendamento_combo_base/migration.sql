ALTER TABLE `agendamento`
  ADD COLUMN `id_combo_base` INTEGER NULL,
  ADD INDEX `fk_agendamento_combo_base` (`id_combo_base`),
  ADD CONSTRAINT `fk_agendamento_combo_base`
    FOREIGN KEY (`id_combo_base`) REFERENCES `combo_base` (`id_combo_base`)
    ON DELETE NO ACTION ON UPDATE NO ACTION;
