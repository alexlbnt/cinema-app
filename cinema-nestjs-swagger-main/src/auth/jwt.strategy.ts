import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { jwtSecret } from './jwt-secret';
import { Papel, UsuarioAutenticado } from './papel';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret(),
    });
  }

  // O papel é lido do banco (não do token): assim uma mudança de papel ou a
  // exclusão do usuário vale na hora, sem esperar o token expirar.
  async validate(payload: { sub: number }): Promise<UsuarioAutenticado | null> {
    const user = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, papel: true },
    });
    if (!user) return null; // Passport responde 401
    return { sub: user.id, email: user.email, papel: user.papel as Papel };
  }
}
