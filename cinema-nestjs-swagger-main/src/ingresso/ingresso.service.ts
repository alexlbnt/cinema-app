import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { escopoDoUsuario, UsuarioAutenticado } from '../auth/papel';
import { CreateIngressoDto } from './dto/create-ingresso.dto';
import { precoIngresso } from './preco';

const INCLUDE = {
  sessao: { include: { filme: true, sala: true } },
  pedido: true,
} as const;

@Injectable()
export class IngressoService {
  constructor(private readonly prisma: PrismaService) {}

  /** Cria um ingresso com o preço da sessão. Sem usuário = compra de visitante. */
  async create(data: CreateIngressoDto, usuarioId?: number) {
    const sessao = await this.prisma.sessao.findUnique({
      where: { id: data.sessaoId },
    });
    if (!sessao) throw new NotFoundException('Sessão não encontrada');

    return this.prisma.ingresso.create({
      data: {
        sessaoId: sessao.id,
        tipo: data.tipo,
        valorPago: precoIngresso(sessao.valorIngresso, data.tipo),
        assento: data.assento,
        usuarioId: usuarioId ?? null,
      },
      include: { sessao: { include: { filme: true, sala: true } } },
    });
  }

  /** Admin: todos os ingressos. Demais: só os do próprio usuário. */
  findAll(user: UsuarioAutenticado) {
    return this.prisma.ingresso.findMany({
      where: escopoDoUsuario(user),
      include: INCLUDE,
    });
  }

  async findOne(id: number, user: UsuarioAutenticado) {
    const ingresso = await this.prisma.ingresso.findFirst({
      where: { id, ...escopoDoUsuario(user) },
      include: INCLUDE,
    });
    // Ingresso de outro usuário responde 404, sem revelar que existe.
    if (!ingresso) throw new NotFoundException('Ingresso não encontrado');
    return ingresso;
  }
}
