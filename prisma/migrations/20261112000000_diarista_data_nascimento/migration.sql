-- Legados ficam nulos; novos cadastros exigem uma data válida na API.
ALTER TABLE `diarista` ADD COLUMN `data_nascimento` DATE NULL;
