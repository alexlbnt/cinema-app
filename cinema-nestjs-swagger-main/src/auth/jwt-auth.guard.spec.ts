import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from './public.decorator';

describe('JwtAuthGuard', () => {
  let reflector: Reflector;
  let guard: JwtAuthGuard;
  let passportCanActivate: jest.SpyInstance;

  const handler = () => undefined;
  class FakeController {}
  const context = {
    getHandler: () => handler,
    getClass: () => FakeController,
  } as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
    // Substitui a validação real do JWT feita pelo Passport
    passportCanActivate = jest
      .spyOn(AuthGuard('jwt').prototype, 'canActivate')
      .mockReturnValue(true);
  });

  afterEach(() => jest.restoreAllMocks());

  it('libera rotas marcadas com @Public() sem validar o JWT', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    expect(guard.canActivate(context)).toBe(true);
    expect(passportCanActivate).not.toHaveBeenCalled();
  });

  it('exige JWT nas rotas sem @Public()', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    void guard.canActivate(context);

    expect(passportCanActivate).toHaveBeenCalledWith(context);
  });

  it('procura @Public() no método e na classe do controller', () => {
    const spy = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(undefined);

    void guard.canActivate(context);

    expect(spy).toHaveBeenCalledWith(IS_PUBLIC_KEY, [handler, FakeController]);
  });
});
