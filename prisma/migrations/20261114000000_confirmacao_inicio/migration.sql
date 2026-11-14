-- Chegada e início são eventos diferentes. Registros iniciados antigos permanecem válidos.
ALTER TABLE `checkin_checkout` ADD COLUMN `horario_chegada` TIMESTAMP(0) NULL;
