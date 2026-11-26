import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UsuarioAutenticado } from './papel';

/**
 * Injeta o usuário logado (`req.user`) no parâmetro do método.
 * Em rotas @Public() pode ser `undefined` (visitante sem token).
 */
export const UsuarioAtual = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioAutenticado | undefined =>
    ctx.switchToHttp().getRequest<{ user?: UsuarioAutenticado }>().user,
);
