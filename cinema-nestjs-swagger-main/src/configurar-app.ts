import { INestApplication, ValidationPipe } from '@nestjs/common';

/**
 * Configuração comum ao servidor (main.ts) e aos testes e2e,
 * para que os testes rodem com as mesmas regras do servidor real.
 */
export function configurarApp(app: INestApplication): void {
  // CORS para o app mobile conseguir conectar
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Validação global de DTOs; campos fora do DTO são descartados
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
}
