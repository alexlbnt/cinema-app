import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    // NestFactory (como no main.ts) em vez de Test.createTestingModule:
    // o ServeStaticModule escolhe o loader ao compilar o módulo e, no
    // TestingModule, o adaptador HTTP ainda não existe nesse momento,
    // então o frontend não seria servido.
    app = await NestFactory.create<INestApplication<App>>(AppModule, {
      logger: false,
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET / entrega o frontend web (index.html)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Content-Type', /html/);
  });

  it('GET /filme é público e retorna uma lista', async () => {
    const res = await request(app.getHttpServer()).get('/filme').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /pedido exige JWT', () => {
    return request(app.getHttpServer()).get('/pedido').expect(401);
  });
});
