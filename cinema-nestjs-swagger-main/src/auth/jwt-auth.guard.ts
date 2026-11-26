import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isPublic) {
      return (await super.canActivate(context)) as boolean;
    }

    // Rota pública: o token é opcional. Se vier um válido, identifica o
    // usuário (ex.: compra vinculada à conta). Se vier vencido ou inválido,
    // segue como visitante em vez de recusar.
    const req = context
      .switchToHttp()
      .getRequest<{ headers?: Record<string, string>; user?: unknown }>();
    if (req.headers?.authorization) {
      try {
        await super.canActivate(context);
      } catch {
        req.user = undefined;
      }
    }
    return true;
  }
}
