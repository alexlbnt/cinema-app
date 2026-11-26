import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PedidoService } from './pedido.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { Public } from '../auth/public.decorator';
import { UsuarioAtual } from '../auth/usuario-atual.decorator';
import type { UsuarioAutenticado } from '../auth/papel';

@ApiTags('Pedidos')
@ApiBearerAuth()
@Controller('pedido')
export class PedidoController {
  constructor(private readonly pedidoService: PedidoService) {}

  @Post()
  @Public()
  @ApiOperation({
    summary:
      'Cria um pedido. JWT opcional: com token, o pedido fica na conta do usuário; ' +
      'sem token, é compra de visitante. O valor total é calculado pelo servidor.',
  })
  create(
    @Body() body: CreatePedidoDto,
    @UsuarioAtual() user?: UsuarioAutenticado,
  ) {
    return this.pedidoService.create(body, user?.sub);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista os pedidos do usuário logado (admin vê todos)',
  })
  findAll(@UsuarioAtual() user: UsuarioAutenticado) {
    return this.pedidoService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Busca um pedido do usuário logado por ID (admin vê qualquer um)',
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() user: UsuarioAutenticado,
  ) {
    return this.pedidoService.findOne(id, user);
  }
}
