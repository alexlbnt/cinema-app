import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_ADMIN_KEY } from './admin.decorator';
import { isAdmin, UsuarioAutenticado } from './papel';

/**
 * Guard global que roda depois do JwtAuthGuard: nas rotas marcadas com
 * @AdminOnly(), só deixa passar usuários com papel ADMIN.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const adminOnly = this.reflector.getAllAndOverride<boolean>(IS_ADMIN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!adminOnly) return true;

    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: UsuarioAutenticado }>();
    if (!isAdmin(user)) {
      throw new ForbiddenException('Apenas administradores');
    }
    return true;
  }
}
