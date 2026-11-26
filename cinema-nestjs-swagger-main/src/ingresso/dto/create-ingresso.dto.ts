import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsIn, IsNotEmpty } from 'class-validator';
import { TIPOS_INGRESSO } from '../preco';

/**
 * O preço (valorPago) é calculado pelo servidor a partir da sessão, e o dono
 * do ingresso vem do token. Se o cliente enviar `valorPago` ou `usuarioId`,
 * os campos são descartados pelo ValidationPipe (whitelist).
 */
export class CreateIngressoDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  sessaoId: number;

  @ApiProperty({ example: 'Inteira', enum: TIPOS_INGRESSO })
  @IsIn(TIPOS_INGRESSO)
  tipo: string;

  @ApiProperty({ example: 'B4' })
  @IsString()
  @IsNotEmpty()
  assento: string;
}
