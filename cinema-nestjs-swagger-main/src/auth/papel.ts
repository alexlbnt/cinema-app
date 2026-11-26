export const Papel = {
  ADMIN: 'ADMIN',
  CLIENTE: 'CLIENTE',
} as const;

export type Papel = (typeof Papel)[keyof typeof Papel];

/** Dados do usuário logado, anexados a `req.user` pelo JwtStrategy. */
export interface UsuarioAutenticado {
  sub: number;
  email: string;
  papel: Papel;
}

export const isAdmin = (user?: UsuarioAutenticado | null): boolean =>
  user?.papel === Papel.ADMIN;

/**
 * Filtro do Prisma para registros com dono (ingressos, pedidos):
 * o admin vê todos; os demais, só os próprios.
 */
export const escopoDoUsuario = (
  user: UsuarioAutenticado,
): { usuarioId?: number } => (isAdmin(user) ? {} : { usuarioId: user.sub });
