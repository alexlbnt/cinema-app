import './load-env'; // precisa ser o primeiro import
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { configurarApp } from './configurar-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS e validação global (compartilhado com os testes e2e)
  configurarApp(app);

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Cinema API')
    .setDescription('API do sistema de cinema com autenticação JWT')
    .setVersion('2.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // 0.0.0.0 para aceitar conexões do celular na mesma rede
  await app.listen(3000, '0.0.0.0');
  console.log('🎬 Cinema API rodando em http://0.0.0.0:3000');
  console.log('📚 Swagger em http://localhost:3000/api');
}
bootstrap();
