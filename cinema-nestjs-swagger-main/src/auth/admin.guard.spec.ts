import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminGuard } from './admin.guard';
import { IS_ADMIN_KEY } from './admin.decorator';
import { Papel, UsuarioAutenticado } from './papel';

describe('AdminGuard', () => {
  let reflector: Reflector;
  let guard: AdminGuard;

  const handler = () => undefined;
  class FakeController {}
  const contexto = (user?: UsuarioAutenticado) =>
    ({
      getHandler: () => handler,
      getClass: () => FakeController,
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as unknown as ExecutionContext;

  const admin: UsuarioAutenticado = {
    sub: 1,
    email: 'a@a',
    papel: Papel.ADMIN,
  };
  const cliente: UsuarioAutenticado = {
    sub: 2,
    email: 'c@c',
    papel: Papel.CLIENTE,
  };

  beforeEach(() => {
    reflector = new Reflector();
    guard = new AdminGuard(reflector);
  });

  it('não interfere em rotas sem @AdminOnly()', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(guard.canActivate(contexto(cliente))).toBe(true);
    expect(guard.canActivate(contexto(undefined))).toBe(true);
  });

  it('libera admin em rotas @AdminOnly()', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    expect(guard.canActivate(contexto(admin))).toBe(true);
  });

  it('recusa cliente e visitante em rotas @AdminOnly()', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    expect(() => guard.canActivate(contexto(cliente))).toThrow(
      ForbiddenException,
    );
    expect(() => guard.canActivate(contexto(undefined))).toThrow(
      ForbiddenException,
    );
  });

  it('procura @AdminOnly() no método e na classe do controller', () => {
    const spy = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(undefined);

    guard.canActivate(contexto(admin));

    expect(spy).toHaveBeenCalledWith(IS_ADMIN_KEY, [handler, FakeController]);
  });
});
