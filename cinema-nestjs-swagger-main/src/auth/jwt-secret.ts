/** Chave de assinatura dos JWT. Lida na hora do uso, depois do .env carregado. */
export const jwtSecret = (): string =>
  process.env.JWT_SECRET || 'cinema-secret-key';
