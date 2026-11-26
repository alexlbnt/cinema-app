// As respostas HTTP (res.body) chegam como JSON sem tipo; nos testes isso é esperado.
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcryptjs';
import { AppModule } from './../src/app.module';
import { configurarApp } from './../src/configurar-app';
import { PrismaService } from './../src/prisma/prisma.service';
import { MailService, Email } from './../src/auth/mail.service';

// Roda contra prisma/test.db, recriado a cada execução (test/e2e-global-setup.ts).
describe('App (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const http = () => request(app.getHttpServer());
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  let tokenAdmin: string;
  let tokenCliente: string;
  let clienteId: number;
  let adminId: number;
  let sessaoId: number;
  let snackId: number;

  beforeAll(async () => {
    // NestFactory (como no main.ts) em vez de Test.createTestingModule:
    // o ServeStaticModule escolhe o loader ao compilar o módulo e, no
    // TestingModule, o adaptador HTTP ainda não existe nesse momento,
    // então o frontend não seria servido.
    app = await NestFactory.create<INestApplication<App>>(AppModule, {
      logger: false,
    });
    configurarApp(app);
    await app.init();
    prisma = app.get(PrismaService);

    // Dados base: admin, sala, filme, sessão (R$ 30) e snack (R$ 10)
    const admin = await prisma.usuario.create({
      data: {
        nome: 'Admin',
        email: 'admin@test.com',
        senha: await bcrypt.hash('senha123', 10),
        papel: 'ADMIN',
      },
    });
    adminId = admin.id;
    const sala = await prisma.sala.create({
      data: { numero: 1, capacidade: 40 },
    });
    const filme = await prisma.filme.create({
      data: {
        titulo: 'Filme Teste',
        genero: 'Drama',
        duracao: 100,
        classificacaoEtaria: 0,
      },
    });
    const sessao = await prisma.sessao.create({
      data: {
        filmeId: filme.id,
        salaId: sala.id,
        dataHorario: new Date('2030-01-01T20:00:00Z'),
        valorIngresso: 30,
      },
    });
    sessaoId = sessao.id;
    snackId = (
      await prisma.snack.create({ data: { nome: 'Pipoca', preco: 10 } })
    ).id;

    tokenAdmin = (
      await http()
        .post('/auth/login')
        .send({ email: 'admin@test.com', senha: 'senha123' })
        .expect(201)
    ).body.access_token;

    const cadastro = await http()
      .post('/auth/register')
      .send({ nome: 'Cliente', email: 'cliente@test.com', senha: 'senha123' })
      .expect(201);
    tokenCliente = cadastro.body.access_token;
    clienteId = cadastro.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('básico', () => {
    it('GET / entrega o frontend web (index.html)', () =>
      http().get('/').expect(200).expect('Content-Type', /html/));

    it('GET /filme é público e retorna uma lista', async () => {
      const res = await http().get('/filme').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /pedido exige JWT', () => http().get('/pedido').expect(401));
  });

  describe('perfil de administrador', () => {
    const filme = {
      titulo: 'Novo',
      genero: 'Ação',
      duracao: 90,
      classificacaoEtaria: 12,
    };

    it('cadastro público sempre cria CLIENTE, mesmo pedindo ADMIN', async () => {
      const res = await http()
        .post('/auth/register')
        .send({
          nome: 'Esperto',
          email: 'esperto@test.com',
          senha: 'senha123',
          papel: 'ADMIN',
        })
        .expect(201);
      expect(res.body.user.papel).toBe('CLIENTE');
    });

    it('login informa o papel do usuário', async () => {
      const res = await http()
        .post('/auth/login')
        .send({ email: 'admin@test.com', senha: 'senha123' })
        .expect(201);
      expect(res.body.user.papel).toBe('ADMIN');
    });

    it('visitante não cria filme (401)', () =>
      http().post('/filme').send(filme).expect(401));

    it('cliente não cria filme (403)', () =>
      http().post('/filme').set(auth(tokenCliente)).send(filme).expect(403));

    it('cliente não apaga sessão (403)', () =>
      http().delete(`/sessao/${sessaoId}`).set(auth(tokenCliente)).expect(403));

    it('admin cria, edita e apaga filme', async () => {
      const criado = await http()
        .post('/filme')
        .set(auth(tokenAdmin))
        .send(filme)
        .expect(201);
      await http()
        .patch(`/filme/${criado.body.id}`)
        .set(auth(tokenAdmin))
        .send({ titulo: 'Editado' })
        .expect(200);
      await http()
        .delete(`/filme/${criado.body.id}`)
        .set(auth(tokenAdmin))
        .expect(200);
    });
  });

  describe('compra: preço no servidor e dono pelo token', () => {
    let ingressoVisitanteId: number;
    let pedidoVisitanteId: number;

    it('visitante compra ingresso; preço enviado pelo cliente é ignorado', async () => {
      const res = await http()
        .post('/ingresso')
        .send({
          sessaoId,
          tipo: 'Meia',
          assento: 'A1',
          valorPago: 0.01,
          usuarioId: clienteId,
        })
        .expect(201);
      expect(res.body.valorPago).toBe(15);
      expect(res.body.usuarioId).toBeNull();
      ingressoVisitanteId = res.body.id;
    });

    it('visitante fecha o pedido; total é calculado no servidor', async () => {
      const res = await http()
        .post('/pedido')
        .send({
          ingressoIds: [ingressoVisitanteId],
          snackIds: [snackId, snackId],
          valorTotal: 1,
        })
        .expect(201);
      expect(res.body.valorTotal).toBe(35); // 15 (meia) + 2 × 10 (snacks)
      expect(res.body.usuarioId).toBeNull();
      pedidoVisitanteId = res.body.id;
    });

    it('com token, a compra vai para a conta do token, não para o usuarioId enviado', async () => {
      const ing = await http()
        .post('/ingresso')
        .set(auth(tokenCliente))
        .send({ sessaoId, tipo: 'Inteira', assento: 'A2', usuarioId: adminId })
        .expect(201);
      expect(ing.body.valorPago).toBe(30);
      expect(ing.body.usuarioId).toBe(clienteId);

      const ped = await http()
        .post('/pedido')
        .set(auth(tokenCliente))
        .send({ ingressoIds: [ing.body.id] })
        .expect(201);
      expect(ped.body.usuarioId).toBe(clienteId);
      expect(ped.body.valorTotal).toBe(30);
    });

    it('pedido com ingressos inline também calcula preços', async () => {
      const res = await http()
        .post('/pedido')
        .send({
          sessaoId,
          ingressos: [{ tipo: 'Inteira' }, { tipo: 'Meia', assento: 'C3' }],
          snacks: [{ snackId, quantidade: 3 }],
        })
        .expect(201);
      expect(res.body.valorTotal).toBe(75); // 30 + 15 + 3 × 10
      expect(res.body.ingressos).toHaveLength(2);
    });

    it('token inválido em rota pública compra como visitante', async () => {
      const res = await http()
        .post('/ingresso')
        .set(auth('token-invalido'))
        .send({ sessaoId, tipo: 'Inteira', assento: 'A3' })
        .expect(201);
      expect(res.body.usuarioId).toBeNull();
    });

    it('sessão inexistente responde 404', () =>
      http()
        .post('/ingresso')
        .send({ sessaoId: 99999, tipo: 'Inteira', assento: 'A4' })
        .expect(404));

    it('listagem: cliente vê só os próprios ingressos e pedidos', async () => {
      const ingressos = await http()
        .get('/ingresso')
        .set(auth(tokenCliente))
        .expect(200);
      expect(ingressos.body.length).toBeGreaterThan(0);
      for (const i of ingressos.body) expect(i.usuarioId).toBe(clienteId);

      const pedidos = await http()
        .get('/pedido')
        .set(auth(tokenCliente))
        .expect(200);
      expect(pedidos.body.length).toBeGreaterThan(0);
      for (const p of pedidos.body) expect(p.usuarioId).toBe(clienteId);
    });

    it('listagem: admin vê os registros de todos', async () => {
      const res = await http().get('/pedido').set(auth(tokenAdmin)).expect(200);
      const pedidos = res.body as { usuarioId: number | null }[];
      const donos = new Set(pedidos.map((p) => p.usuarioId));
      expect(donos.has(null)).toBe(true);
      expect(donos.has(clienteId)).toBe(true);
    });

    it('cliente não acessa pedido nem ingresso de outra pessoa (404)', async () => {
      await http()
        .get(`/pedido/${pedidoVisitanteId}`)
        .set(auth(tokenCliente))
        .expect(404);
      await http()
        .get(`/ingresso/${ingressoVisitanteId}`)
        .set(auth(tokenCliente))
        .expect(404);
    });
  });

  describe('validação do POST /pedido', () => {
    const novoIngresso = async (token?: string) => {
      const req = http().post('/ingresso');
      if (token) req.set(auth(token));
      const res = await req
        .send({ sessaoId, tipo: 'Inteira', assento: 'B1' })
        .expect(201);
      return res.body.id as number;
    };

    it('recusa pedido sem ingressos (400)', () =>
      http().post('/pedido').send({}).expect(400));

    it('recusa tipos inválidos (400)', () =>
      http()
        .post('/pedido')
        .send({ ingressoIds: ['abc'], snackIds: 'x' })
        .expect(400));

    it('recusa ingresso inline com tipo desconhecido (400)', () =>
      http()
        .post('/pedido')
        .send({ sessaoId, ingressos: [{ tipo: 'VIP' }] })
        .expect(400));

    it('recusa ingresso que já está em outro pedido (409)', async () => {
      const id = await novoIngresso();
      await http()
        .post('/pedido')
        .send({ ingressoIds: [id] })
        .expect(201);
      await http()
        .post('/pedido')
        .send({ ingressoIds: [id] })
        .expect(409);
    });

    it('recusa ingresso de outra conta (403)', async () => {
      const id = await novoIngresso(); // ingresso de visitante
      await http()
        .post('/pedido')
        .set(auth(tokenCliente))
        .send({ ingressoIds: [id] })
        .expect(403);
    });

    it('recusa snack inexistente sem criar nada (404)', async () => {
      const id = await novoIngresso();
      await http()
        .post('/pedido')
        .send({ ingressoIds: [id], snackIds: [99999] })
        .expect(404);
      const ingresso = await prisma.ingresso.findUnique({ where: { id } });
      expect(ingresso?.pedidoId).toBeNull();
    });
  });

  describe('recuperação de senha', () => {
    let enviados: Email[];

    beforeEach(() => {
      enviados = [];
      jest
        .spyOn(app.get(MailService), 'enviar')
        .mockImplementation((email: Email) => {
          enviados.push(email);
          return Promise.resolve();
        });
    });

    afterEach(() => jest.restoreAllMocks());

    const pedirLink = async (email: string) => {
      await http().post('/auth/forgot-password').send({ email }).expect(200);
      const match = /redefinir-senha\?token=(\S+)/.exec(
        enviados[0]?.texto ?? '',
      );
      return match ? decodeURIComponent(match[1]) : undefined;
    };

    it('e-mail desconhecido recebe a mesma resposta e nada é enviado', async () => {
      const res = await http()
        .post('/auth/forgot-password')
        .send({ email: 'ninguem@test.com' })
        .expect(200);
      expect(res.body.message).toMatch(/Se este e-mail/);
      expect(enviados).toHaveLength(0);
    });

    it('envia o link, redefine a senha e o link não vale de novo', async () => {
      const token = await pedirLink('cliente@test.com');
      expect(enviados[0].para).toBe('cliente@test.com');
      expect(enviados[0].texto).toContain(
        'http://cinema.test/redefinir-senha?token=',
      );
      expect(token).toBeDefined();

      await http()
        .post('/auth/reset-password')
        .send({ token, novaSenha: 'novaSenha456' })
        .expect(200);

      await http()
        .post('/auth/login')
        .send({ email: 'cliente@test.com', senha: 'senha123' })
        .expect(401);
      await http()
        .post('/auth/login')
        .send({ email: 'cliente@test.com', senha: 'novaSenha456' })
        .expect(201);

      // Uso único: depois da troca de senha, o mesmo link deixa de valer
      await http()
        .post('/auth/reset-password')
        .send({ token, novaSenha: 'outraSenha789' })
        .expect(400);
    });

    it('recusa token inválido (400) e senha curta (400)', async () => {
      await http()
        .post('/auth/reset-password')
        .send({ token: 'lixo', novaSenha: 'novaSenha456' })
        .expect(400);

      const token = await pedirLink('admin@test.com');
      await http()
        .post('/auth/reset-password')
        .send({ token, novaSenha: '123' })
        .expect(400);
    });

    it('um JWT de login não serve como token de redefinição', () =>
      http()
        .post('/auth/reset-password')
        .send({ token: tokenAdmin, novaSenha: 'novaSenha456' })
        .expect(400));
  });
});
