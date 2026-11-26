import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { escopoDoUsuario, UsuarioAutenticado } from '../auth/papel';
import { precoIngresso } from '../ingresso/preco';
import { CreatePedidoDto } from './dto/create-pedido.dto';

const INCLUDE = {
  ingressos: {
    include: { sessao: { include: { filme: true, sala: true } } },
  },
  snacks: true,
} as const;

const arredondar = (v: number) => Math.round(v * 100) / 100;

@Injectable()
export class PedidoService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria o pedido calculando o valor total no servidor
   * (ingressos + snacks). Sem usuário = compra de visitante.
   */
  async create(data: CreatePedidoDto, usuarioId?: number) {
    const dono = usuarioId ?? null;

    return this.prisma.$transaction(async (tx) => {
      // ── Ingressos já criados (POST /ingresso) ──────────────────────────────
      const ids = data.ingressoIds ?? [];
      const existentes = ids.length
        ? await tx.ingresso.findMany({ where: { id: { in: ids } } })
        : [];
      for (const id of ids) {
        const ing = existentes.find((i) => i.id === id);
        if (!ing) throw new NotFoundException(`Ingresso ${id} não encontrado`);
        if (ing.pedidoId !== null) {
          throw new ConflictException(
            `Ingresso ${id} já pertence a outro pedido`,
          );
        }
        if (ing.usuarioId !== dono) {
          throw new ForbiddenException(`Ingresso ${id} pertence a outra conta`);
        }
      }
      const ingressos = existentes.map((i) => ({
        id: i.id,
        valorPago: i.valorPago,
      }));

      // ── Ingressos enviados junto com o pedido (sessaoId + ingressos) ───────
      if (data.ingressos?.length) {
        const sessao = await tx.sessao.findUnique({
          where: { id: data.sessaoId },
        });
        if (!sessao) throw new NotFoundException('Sessão não encontrada');

        const letras = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        for (const [idx, ing] of data.ingressos.entries()) {
          const assento =
            ing.assento ||
            `${letras[Math.floor(idx / 8)] || 'A'}${(idx % 8) + 1}`;
          const criado = await tx.ingresso.create({
            data: {
              sessaoId: sessao.id,
              tipo: ing.tipo,
              valorPago: precoIngresso(sessao.valorIngresso, ing.tipo),
              assento,
              usuarioId: dono,
            },
          });
          ingressos.push({ id: criado.id, valorPago: criado.valorPago });
        }
      }

      if (!ingressos.length) {
        throw new BadRequestException(
          'O pedido precisa de pelo menos um ingresso',
        );
      }

      // ── Snacks (snackIds, ou snacks com quantidade) ────────────────────────
      let snackIds = data.snackIds ?? [];
      if (!snackIds.length && data.snacks?.length) {
        snackIds = data.snacks.flatMap((s) =>
          Array<number>(s.quantidade ?? 1).fill(s.snackId),
        );
      }
      const distintos = [...new Set(snackIds)];
      const snacks = distintos.length
        ? await tx.snack.findMany({ where: { id: { in: distintos } } })
        : [];
      const precoSnack = new Map(snacks.map((s) => [s.id, s.preco]));
      for (const id of distintos) {
        if (!precoSnack.has(id))
          throw new NotFoundException(`Snack ${id} não encontrado`);
      }

      // ── Total calculado no servidor ────────────────────────────────────────
      const valorTotal = arredondar(
        ingressos.reduce((soma, i) => soma + i.valorPago, 0) +
          snackIds.reduce((soma, id) => soma + (precoSnack.get(id) ?? 0), 0),
      );

      return tx.pedido.create({
        data: {
          valorTotal,
          usuarioId: dono,
          ingressos: { connect: ingressos.map(({ id }) => ({ id })) },
          snacks: distintos.length
            ? { connect: distintos.map((id) => ({ id })) }
            : undefined,
        },
        include: INCLUDE,
      });
    });
  }

  /** Admin: todos os pedidos. Demais: só os do próprio usuário. */
  findAll(user: UsuarioAutenticado) {
    return this.prisma.pedido.findMany({
      where: escopoDoUsuario(user),
      include: INCLUDE,
      orderBy: { dataHora: 'desc' },
    });
  }

  async findOne(id: number, user: UsuarioAutenticado) {
    const pedido = await this.prisma.pedido.findFirst({
      where: { id, ...escopoDoUsuario(user) },
      include: INCLUDE,
    });
    // Pedido de outro usuário responde 404, sem revelar que existe.
    if (!pedido) throw new NotFoundException('Pedido não encontrado');
    return pedido;
  }
}
