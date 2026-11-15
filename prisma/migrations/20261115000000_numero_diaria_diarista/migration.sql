-- O ID global e todas as relações financeiras permanecem intactos.
ALTER TABLE `agendamento` ADD COLUMN `numero_diarista` INTEGER NULL;
ALTER TABLE `diarista` ADD COLUMN `ultimo_numero_diaria` INTEGER NOT NULL DEFAULT 0;

-- Sequência histórica por ordem de criação, não pela data marcada para o serviço.
UPDATE `agendamento` AS a
JOIN (
  SELECT `id_agendamento`, ROW_NUMBER() OVER (
    PARTITION BY `id_diarista` ORDER BY `id_agendamento`
  ) AS `numero`
  FROM `agendamento`
) AS numbered ON numbered.`id_agendamento` = a.`id_agendamento`
SET a.`numero_diarista` = numbered.`numero`;

UPDATE `diarista` AS d
JOIN (
  SELECT `id_diarista`, MAX(`numero_diarista`) AS `ultimo`
  FROM `agendamento` GROUP BY `id_diarista`
) AS numbered ON numbered.`id_diarista` = d.`id_diarista`
SET d.`ultimo_numero_diaria` = numbered.`ultimo`;

ALTER TABLE `agendamento` MODIFY `numero_diarista` INTEGER NOT NULL;
CREATE UNIQUE INDEX `uq_diaria_numero_diarista` ON `agendamento` (`id_diarista`, `numero_diarista`);
