import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { TIPOS_INGRESSO } from '../../ingresso/preco';

export class IngressoDoPedidoDto {
  @ApiProperty({ example: 'Inteira', enum: TIPOS_INGRESSO })
  @IsIn(TIPOS_INGRESSO)
  tipo: string;

  @ApiPropertyOptional({
    example: 'B4',
    description: 'Se omitido, o servidor atribui um assento',
  })
  @IsOptional()
  @IsString()
  assento?: string;
}

export class SnackDoPedidoDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  snackId: number;

  @ApiPropertyOptional({ example: 2, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  quantidade?: number;
}

/**
 * Aceita dois formatos (pelo menos um ingresso é obrigatório):
 * - `ingressoIds`: ingressos já criados via POST /ingresso (app e site);
 * - `sessaoId` + `ingressos`: cria os ingressos junto com o pedido.
 *
 * O valor total é calculado pelo servidor. Se o cliente enviar `valorTotal`
 * ou `usuarioId`, os campos são descartados pelo ValidationPipe (whitelist).
 */
export class CreatePedidoDto {
  @ApiPropertyOptional({
    example: [1, 2],
    description: 'IDs de ingressos já criados',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  ingressoIds?: number[];

  @ApiPropertyOptional({
    example: [1, 1, 3],
    description: 'IDs dos snacks; repita o ID para mais de uma unidade',
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  snackIds?: number[];

  @ApiPropertyOptional({
    example: 1,
    description: 'Obrigatório junto com `ingressos`',
  })
  @ValidateIf((o: CreatePedidoDto) => !!o.ingressos?.length)
  @IsInt()
  sessaoId?: number;

  @ApiPropertyOptional({ type: [IngressoDoPedidoDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngressoDoPedidoDto)
  ingressos?: IngressoDoPedidoDto[];

  @ApiPropertyOptional({
    type: [SnackDoPedidoDto],
    description: 'Alternativa a `snackIds`, com quantidade',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SnackDoPedidoDto)
  snacks?: SnackDoPedidoDto[];
}
