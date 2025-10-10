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
} from '@nestjs/common';
import { SemillerasService } from './semilleras.service';
import { CreateSemilleraDto } from './dto/create-semillera.dto';
import { UpdateSemilleraDto } from './dto/update-semillera.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/roles.enum';
import { Semillera } from './entities/semillera.entity';

@Controller('semilleras')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SemillerasController {
  constructor(private readonly semillerasService: SemillerasService) {}

  @Post()
  @Roles(Role.ADMIN, Role.ENCARGADO)
  create(@Body() createSemillaDto: CreateSemilleraDto): Promise<Semillera> {
    return this.semillerasService.create(createSemillaDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findAll(): Promise<Semillera[]> {
    return this.semillerasService.findAll();
  }

  @Get('activas')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findAllActive(): Promise<Semillera[]> {
    return this.semillerasService.findAllActive();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Semillera> {
    return this.semillerasService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.ENCARGADO)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSemillaDto: UpdateSemilleraDto,
  ): Promise<Semillera> {
    return this.semillerasService.update(id, updateSemillaDto);
  }

  @Patch(':id/toggle-active')
  @Roles(Role.ADMIN)
  toggleActive(@Param('id', ParseIntPipe) id: number): Promise<Semillera> {
    return this.semillerasService.toggleActive(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.semillerasService.remove(id);
  }
}
