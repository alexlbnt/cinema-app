import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FilmeService } from './filme.service';
import { CreateFilmeDto } from './dto/create-filme.dto';
import { UpdateFilmeDto } from './dto/update-filme.dto';
import { Public } from '../auth/public.decorator';
import { AdminOnly } from '../auth/admin.decorator';

@ApiTags('Filmes')
@Controller('filme')
export class FilmeController {
  constructor(private readonly filmeService: FilmeService) {}

  @Post()
  @AdminOnly()
  @ApiOperation({ summary: 'Cadastra um novo filme' })
  create(@Body() createFilmeDto: CreateFilmeDto) {
    return this.filmeService.create(createFilmeDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Filmes em exibição com seus Gêneros' })
  findAll() {
    return this.filmeService.findAll();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Busca as informações detalhadas de um filme' })
  findOne(@Param('id') id: string) {
    return this.filmeService.findOne(+id);
  }

  @Patch(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Atualiza um filme existente' })
  update(@Param('id') id: string, @Body() updateFilmeDto: UpdateFilmeDto) {
    return this.filmeService.update(+id, updateFilmeDto);
  }

  @Delete(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Remove um filme pelo ID' })
  remove(@Param('id') id: string) {
    return this.filmeService.remove(+id);
  }
}
