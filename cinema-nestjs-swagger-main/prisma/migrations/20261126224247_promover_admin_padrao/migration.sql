-- O campo "papel" entrou com padrão 'CLIENTE' para todos os usuários existentes.
-- Promove a conta administradora padrão do seed, para quem já tinha o banco
-- não precisar rodar o seed de novo (o que duplicaria filmes e sessões).
UPDATE "Usuario" SET "papel" = 'ADMIN' WHERE "email" = 'admin@cinema.com';
