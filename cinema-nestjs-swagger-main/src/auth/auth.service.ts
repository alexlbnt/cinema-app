// src/auth/auth.service.ts
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from './mail.service';
import { jwtSecret } from './jwt-secret';

type UsuarioDb = {
  id: number;
  nome: string;
  email: string;
  senha: string;
  papel: string;
};

const MENSAGEM_RECUPERACAO =
  'Se este e-mail estiver cadastrado, você receberá um link para redefinir a senha.';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mail: MailService,
  ) {}

  // ─── Registro ───────────────────────────────────────────────────────────────
  // Todo cadastro público entra como CLIENTE (padrão do banco).
  async register(nome: string, email: string, senha: string) {
    const exists = await this.prisma.usuario.findUnique({ where: { email } });
    if (exists) throw new ConflictException('E-mail já cadastrado');

    const hash = await bcrypt.hash(senha, 10);
    const user = await this.prisma.usuario.create({
      data: { nome, email, senha: hash },
    });
    return this.sessao(user);
  }

  // ─── Login ───────────────────────────────────────────────────────────────────
  async login(email: string, senha: string) {
    const user = await this.prisma.usuario.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Credenciais inválidas');

    const valid = await bcrypt.compare(senha, user.senha);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');

    return this.sessao(user);
  }

  // ─── Recuperar Senha ─────────────────────────────────────────────────────────
  async forgotPassword(email: string) {
    const user = await this.prisma.usuario.findUnique({ where: { email } });
    // Mesma resposta exista ou não o e-mail, para não revelar quem tem conta.
    if (!user) return { message: MENSAGEM_RECUPERACAO };

    const token = this.jwtService.sign(
      { sub: user.id, type: 'reset' },
      { secret: this.resetSecret(user), expiresIn: '1h' },
    );
    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const link = `${frontend}/redefinir-senha?token=${encodeURIComponent(token)}`;

    try {
      await this.mail.enviar({
        para: user.email,
        assunto: 'Redefinição de senha — Cinema',
        texto:
          `Olá, ${user.nome}!\n\n` +
          `Recebemos um pedido para redefinir sua senha. Acesse o link abaixo ` +
          `(válido por 1 hora):\n\n${link}\n\n` +
          `Se não foi você, ignore este e-mail.`,
      });
    } catch (err) {
      // Não expõe falhas de SMTP ao cliente; fica registrado no servidor.
      this.logger.error(
        `Falha ao enviar e-mail de redefinição: ${String(err)}`,
      );
    }

    return { message: MENSAGEM_RECUPERACAO };
  }

  // ─── Redefinir Senha ─────────────────────────────────────────────────────────
  async resetPassword(token: string, novaSenha: string) {
    const invalido = new BadRequestException(
      'Link de redefinição inválido ou expirado',
    );

    const decoded: unknown = this.jwtService.decode(token);
    const sub =
      decoded && typeof decoded === 'object' && 'sub' in decoded
        ? Number((decoded as { sub: unknown }).sub)
        : NaN;
    if (!Number.isInteger(sub)) throw invalido;

    const user = await this.prisma.usuario.findUnique({ where: { id: sub } });
    if (!user) throw invalido;

    try {
      const payload = this.jwtService.verify<{ type?: string }>(token, {
        secret: this.resetSecret(user),
      });
      if (payload.type !== 'reset') throw invalido;
    } catch {
      throw invalido;
    }

    await this.prisma.usuario.update({
      where: { id: user.id },
      data: { senha: await bcrypt.hash(novaSenha, 10) },
    });
    return { message: 'Senha redefinida com sucesso' };
  }

  // ─── Me (perfil autenticado) ─────────────────────────────────────────────────
  async getMe(userId: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return this.dadosPublicos(user);
  }

  // ─── Auxiliares ──────────────────────────────────────────────────────────────
  private sessao(user: UsuarioDb) {
    return {
      access_token: this.jwtService.sign({ sub: user.id, email: user.email }),
      user: this.dadosPublicos(user),
    };
  }

  private dadosPublicos(user: UsuarioDb) {
    return {
      id: user.id,
      nome: user.nome,
      email: user.email,
      papel: user.papel,
    };
  }

  /**
   * O token de redefinição é assinado com a chave do JWT + o hash da senha
   * atual: depois que a senha muda, o mesmo link deixa de valer (uso único).
   */
  private resetSecret(user: UsuarioDb): string {
    return jwtSecret() + user.senha;
  }
}
