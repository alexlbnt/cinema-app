import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { existsSync } from 'fs';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { FilmeModule } from './filme/filme.module';
import { SalaModule } from './sala/sala.module';
import { SessaoModule } from './sessao/sessao.module';
import { IngressoModule } from './ingresso/ingresso.module';
import { PedidoModule } from './pedido/pedido.module';
import { SnackModule } from './snack/snack.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

// Pasta com o build do frontend web (gerado por `npm run build` em frontend/).
// Em desenvolvimento este arquivo roda de src/; compilado, roda de dist/src/.
const frontendPath =
  [join(__dirname, '..', 'public'), join(__dirname, '..', '..', 'public')].find(
    (p) => existsSync(join(p, 'index.html')),
  ) ?? join(__dirname, '..', 'public');

@Module({
  imports: [
    // Serve o frontend em http://localhost:3000/. Só responde aos GETs que
    // nenhum controller atende, então as rotas da API têm prioridade.
    ServeStaticModule.forRoot({
      rootPath: frontendPath,
      exclude: ['/api{/*path}'], // Swagger
    }),
    PrismaModule,
    FilmeModule,
    SalaModule,
    SessaoModule,
    IngressoModule,
    PedidoModule,
    SnackModule,
    AuthModule,
  ],
  providers: [
    // Guard global — protege TODAS as rotas automaticamente
    // Rotas públicas usam @Public() para abrir exceção
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
