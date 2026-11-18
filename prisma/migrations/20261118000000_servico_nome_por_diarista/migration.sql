-- Service names belong to each professional's offering, not to a global namespace.
-- The Prisma schema already models nome_servico as non-unique.
-- Preserve all catalog rows and historical booking references.
ALTER TABLE `servico` DROP INDEX `uq_servico_nome`;
