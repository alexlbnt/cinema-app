import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from './public.decorator';

describe('JwtAuthGuard', () => {
  let reflector: Reflector;
  let guard: JwtAuthGuard;
  let passportCanActivate: jest.SpyInstance;
  let req: { headers: Record<string, string>; user?: unknown };

  const handler = () => undefined;
  class FakeController {}
  const context = {
    getHandler: () => handler,
    getClass: () => FakeController,
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;

  const marcarComoPublica = (publica: boolean) =>
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(publica || undefined);

  beforeEach(() => {
    req = { headers: {} };
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
    // Substitui a validação real do JWT feita pelo Passport
    passportCanActivate = jest
      .spyOn(AuthGuard('jwt').prototype, 'canActivate')
      .mockResolvedValue(true);
  });

  afterEach(() => jest.restoreAllMocks());

  describe('rota sem @Public()', () => {
    it('exige JWT', async () => {
      marcarComoPublica(false);

      await expect(guard.canActivate(context)).resolves.toBe(true);
      expect(passportCanActivate).toHaveBeenCalledWith(context);
    });

    it('recusa quando o JWT é inválido', async () => {
      marcarComoPublica(false);
      passportCanActivate.mockRejectedValue(new UnauthorizedException());

      await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('rota com @Public()', () => {
    it('libera visitante sem token, sem chamar o Passport', async () => {
      marcarComoPublica(true);

      await expect(guard.canActivate(context)).resolves.toBe(true);
      expect(passportCanActivate).not.toHaveBeenCalled();
    });

    it('identifica o usuário quando vem um token', async () => {
      marcarComoPublica(true);
      req.headers.authorization = 'Bearer token-valido';

      await expect(guard.canActivate(context)).resolves.toBe(true);
      expect(passportCanActivate).toHaveBeenCalledWith(context);
    });

    it('trata token inválido como visitante, sem recusar', async () => {
      marcarComoPublica(true);
      req.headers.authorization = 'Bearer token-vencido';
      req.user = { sub: 1 };
      passportCanActivate.mockRejectedValue(new UnauthorizedException());

      await expect(guard.canActivate(context)).resolves.toBe(true);
      expect(req.user).toBeUndefined();
    });
  });

  it('procura @Public() no método e na classe do controller', async () => {
    const spy = marcarComoPublica(true);

    await guard.canActivate(context);

    expect(spy).toHaveBeenCalledWith(IS_PUBLIC_KEY, [handler, FakeController]);
  });
});
