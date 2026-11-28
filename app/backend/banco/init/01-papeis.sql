-- Roda uma vez, como superusuário do contêiner, na criação do volume (CA-2).
-- Sem senha: o banco local só aceita conexões de 127.0.0.1 (DT-12).

-- Papel de migração: dono das tabelas. Usado só por `npm run migrar`.
CREATE ROLE creditogov_migracao LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB;

-- Papel de trabalho: usado pela API e pelo `npm run admin`. Sem posse de tabela.
CREATE ROLE creditogov_app LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB;

CREATE DATABASE creditogov OWNER creditogov_migracao;
GRANT CONNECT ON DATABASE creditogov TO creditogov_app;
