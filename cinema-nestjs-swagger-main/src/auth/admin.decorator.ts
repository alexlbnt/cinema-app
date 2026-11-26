import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse } from '@nestjs/swagger';

export const IS_ADMIN_KEY = 'isAdminOnly';

/** Restringe a rota a usuários com papel ADMIN (exige JWT). */
export const AdminOnly = () =>
  applyDecorators(
    SetMetadata(IS_ADMIN_KEY, true),
    ApiBearerAuth(),
    ApiForbiddenResponse({ description: 'Apenas administradores' }),
  );
