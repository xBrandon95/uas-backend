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
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/roles.enum';
import { Cliente } from './entities/cliente.entity';
import { PaginationDto } from '../cooperadores/dto/pagination.dto';

@Controller('clientes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.ENCARGADO)
  create(@Body() createClienteDto: CreateClienteDto): Promise<Cliente> {
    return this.clientesService.create(createClienteDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findAll(@Query() paginationDto: PaginationDto) {
    return this.clientesService.findAll(paginationDto);
  }

  @Get('activos')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findAllActive(): Promise<Cliente[]> {
    return this.clientesService.findAllActive();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Cliente> {
    return this.clientesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.ENCARGADO)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClienteDto: UpdateClienteDto,
  ): Promise<Cliente> {
    return this.clientesService.update(id, updateClienteDto);
  }

  @Patch(':id/toggle-active')
  @Roles(Role.ADMIN)
  toggleActive(@Param('id', ParseIntPipe) id: number): Promise<Cliente> {
    return this.clientesService.toggleActive(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.clientesService.remove(id);
  }
}
