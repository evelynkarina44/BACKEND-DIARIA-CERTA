ALTER TABLE `usuario`
  MODIFY COLUMN `tipo` ENUM('CLIENTE', 'DIARISTA', 'AMBOS') NOT NULL DEFAULT 'CLIENTE';

UPDATE `usuario` AS `u`
SET `u`.`tipo` = CASE
  WHEN EXISTS (SELECT 1 FROM `cliente` AS `c` WHERE `c`.`id_usuario` = `u`.`id_usuario`)
   AND EXISTS (SELECT 1 FROM `diarista` AS `d` WHERE `d`.`id_usuario` = `u`.`id_usuario`) THEN 'AMBOS'
  WHEN EXISTS (SELECT 1 FROM `diarista` AS `d` WHERE `d`.`id_usuario` = `u`.`id_usuario`) THEN 'DIARISTA'
  WHEN EXISTS (SELECT 1 FROM `cliente` AS `c` WHERE `c`.`id_usuario` = `u`.`id_usuario`) THEN 'CLIENTE'
  ELSE `u`.`tipo`
END;
