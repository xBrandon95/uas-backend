import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { SemillasService } from './semillas.service';
import { CreateSemillaDto } from './dto/create-semilla.dto';
import { UpdateSemillaDto } from './dto/update-semilla.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/roles.enum';
import { Semilla } from './entities/semilla.entity';
import { PaginationDto } from '../cooperadores/dto/pagination.dto';

@Controller('semillas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SemillasController {
  constructor(private readonly semillasService: SemillasService) {}

  @Post()
  @Roles(Role.ADMIN, Role.ENCARGADO)
  create(@Body() createSemillaDto: CreateSemillaDto): Promise<Semilla> {
    return this.semillasService.create(createSemillaDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findAll(@Query() paginationDto: PaginationDto) {
    return this.semillasService.findAll(paginationDto);
  }

  @Get('activas')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findAllActive(): Promise<Semilla[]> {
    return this.semillasService.findAllActive();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Semilla> {
    return this.semillasService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.ENCARGADO)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSemillaDto: UpdateSemillaDto,
  ): Promise<Semilla> {
    return this.semillasService.update(id, updateSemillaDto);
  }

  @Patch(':id/toggle-active')
  @Roles(Role.ADMIN)
  toggleActive(@Param('id', ParseIntPipe) id: number): Promise<Semilla> {
    return this.semillasService.toggleActive(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.semillasService.remove(id);
  }
}
