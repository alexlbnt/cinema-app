// Ambiente dos testes e2e, carregado antes de cada arquivo de teste.
// Usa um banco separado (prisma/test.db) para não mexer no banco de desenvolvimento.
// Caminho relativo à pasta prisma/, como no .env.
export const TEST_DATABASE_URL = 'file:./test.db';

process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.JWT_SECRET = 'segredo-dos-testes-e2e';
process.env.FRONTEND_URL = 'http://cinema.test';
// Sem SMTP: o MailService não tenta enviar e-mail de verdade.
delete process.env.SMTP_HOST;
