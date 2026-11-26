import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IngressoService } from './ingresso.service';
import { CreateIngressoDto } from './dto/create-ingresso.dto';
import { Public } from '../auth/public.decorator';
import { UsuarioAtual } from '../auth/usuario-atual.decorator';
import type { UsuarioAutenticado } from '../auth/papel';

@ApiTags('Ingressos')
@ApiBearerAuth()
@Controller('ingresso')
export class IngressoController {
  constructor(private readonly ingressoService: IngressoService) {}

  @Post()
  @Public()
  @ApiOperation({
    summary:
      'Cria um ingresso. JWT opcional: com token, o ingresso fica na conta do usuário; ' +
      'sem token, é compra de visitante. O preço é calculado pela sessão.',
  })
  create(
    @Body() createIngressoDto: CreateIngressoDto,
    @UsuarioAtual() user?: UsuarioAutenticado,
  ) {
    return this.ingressoService.create(createIngressoDto, user?.sub);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista os ingressos do usuário logado (admin vê todos)',
  })
  findAll(@UsuarioAtual() user: UsuarioAutenticado) {
    return this.ingressoService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Busca um ingresso do usuário logado por ID (admin vê qualquer um)',
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() user: UsuarioAutenticado,
  ) {
    return this.ingressoService.findOne(id, user);
  }
}
