-- Dados da residência passam a pertencer ao endereço. Campos antigos do cliente
-- permanecem para compatibilidade; agendamentos anteriores não são alterados.
ALTER TABLE `endereco`
  ADD COLUMN `apelido` VARCHAR(60) NULL,
  ADD COLUMN `qtd_comodos` INT NULL,
  ADD COLUMN `tamanho_casa` ENUM('pequena', 'media', 'grande') NULL;

UPDATE `endereco` e
JOIN `cliente` c ON c.id_cliente = e.id_cliente
SET e.apelido = CONCAT('Casa ', e.id_endereco),
    e.qtd_comodos = c.qtd_comodos,
    e.tamanho_casa = c.tamanho_casa;
