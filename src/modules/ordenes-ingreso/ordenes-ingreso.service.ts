import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { OrdenIngreso } from './entities/orden-ingreso.entity';
import { CreateOrdenIngresoDto } from './dto/create-orden-ingreso.dto';
import { UpdateOrdenIngresoDto } from './dto/update-orden-ingreso.dto';
import { LoteProduccion } from '../lotes-produccion/entities/lote-produccion.entity';
import { Role } from 'src/common/enums/roles.enum';

@Injectable()
export class OrdenesIngresoService {
  constructor(
    @InjectRepository(OrdenIngreso)
    private readonly ordenIngresoRepository: Repository<OrdenIngreso>,
    @InjectRepository(LoteProduccion)
    private readonly loteProduccionRepository: Repository<LoteProduccion>,
  ) {}

  async create(
    createOrdenIngresoDto: CreateOrdenIngresoDto,
    idUsuarioCreador: number,
    rol: Role,
    idUnidadUsuario?: number,
  ): Promise<OrdenIngreso> {
    let idUnidadFinal: number;

    if (rol === Role.ADMIN) {
      // ✅ El admin puede crear en cualquier unidad (debe venir en el DTO)
      if (!createOrdenIngresoDto.id_unidad) {
        throw new BadRequestException('Debe especificar una unidad');
      }
      idUnidadFinal = createOrdenIngresoDto.id_unidad;
    } else {
      // 🔒 Los demás roles deben crear solo en su propia unidad
      if (!idUnidadUsuario) {
        throw new ForbiddenException('No se encontró la unidad del usuario');
      }

      idUnidadFinal = idUnidadUsuario;

      // Validar que no intente crear en otra unidad (aunque venga en el DTO)
      if (
        createOrdenIngresoDto.id_unidad &&
        createOrdenIngresoDto.id_unidad !== idUnidadUsuario
      ) {
        throw new ForbiddenException(
          'No puedes crear órdenes en otras unidades',
        );
      }
    }

    // Generar número de orden automático
    const numeroOrden = await this.generarNumeroOrden();

    const ordenIngreso = this.ordenIngresoRepository.create({
      ...createOrdenIngresoDto,
      numero_orden: numeroOrden,
      id_usuario_creador: idUsuarioCreador,
      id_unidad: idUnidadFinal, // ✅ depende del rol
      estado: createOrdenIngresoDto.estado || 'pendiente',
    });

    return await this.ordenIngresoRepository.save(ordenIngreso);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search: string = '',
    rol: Role,
    idUnidadUsuario?: number,
  ): Promise<{ data: OrdenIngreso[]; meta: any }> {
    const skip = (page - 1) * limit;

    const queryBuilder = this.ordenIngresoRepository
      .createQueryBuilder('orden')
      .leftJoinAndSelect('orden.semillera', 'semillera')
      .leftJoinAndSelect('orden.cooperador', 'cooperador')
      .leftJoinAndSelect('orden.conductor', 'conductor')
      .leftJoinAndSelect('orden.vehiculo', 'vehiculo')
      .leftJoinAndSelect('orden.semilla', 'semilla')
      .leftJoinAndSelect('orden.variedad', 'variedad')
      .leftJoinAndSelect('orden.categoria_ingreso', 'categoria_ingreso')
      .leftJoinAndSelect('orden.unidad', 'unidad')
      .leftJoinAndSelect('orden.usuario_creador', 'usuario_creador')
      // ✅ NUEVO: Contar lotes asociados
      .loadRelationCountAndMap('orden.cantidad_lotes', 'orden.lotes_produccion')
      .orderBy('orden.fecha_creacion', 'DESC');

    // Filtros existentes...
    if (rol !== Role.ADMIN && idUnidadUsuario) {
      queryBuilder.where('orden.id_unidad = :idUnidad', {
        idUnidad: idUnidadUsuario,
      });
    }

    if (search) {
      const whereCondition =
        rol !== Role.ADMIN && idUnidadUsuario
          ? 'orden.id_unidad = :idUnidad AND '
          : '';

      queryBuilder.andWhere(
        `${whereCondition}(
        orden.numero_orden LIKE :search OR
        semillera.nombre LIKE :search OR
        cooperador.nombre LIKE :search OR
        semilla.nombre LIKE :search OR
        variedad.nombre LIKE :search OR
        conductor.nombre LIKE :search OR
        vehiculo.placa LIKE :search
      )`,
        {
          search: `%${search}%`,
          ...(idUnidadUsuario && { idUnidad: idUnidadUsuario }),
        },
      );
    }

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // ✅ Agregar flag calculado
    const dataConFlags = data.map((orden) => ({
      ...orden,
      tiene_lotes_produccion: (orden as any).cantidad_lotes > 0,
      puede_editarse:
        orden.estado !== 'completado' && (orden as any).cantidad_lotes === 0,
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      data: dataConFlags,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findByEstado(
    estado: string,
    rol: Role,
    idUnidadUsuario?: number,
  ): Promise<OrdenIngreso[]> {
    const queryBuilder = this.ordenIngresoRepository
      .createQueryBuilder('orden')
      .leftJoinAndSelect('orden.semillera', 'semillera')
      .leftJoinAndSelect('orden.cooperador', 'cooperador')
      .leftJoinAndSelect('orden.conductor', 'conductor')
      .leftJoinAndSelect('orden.vehiculo', 'vehiculo')
      .leftJoinAndSelect('orden.semilla', 'semilla')
      .leftJoinAndSelect('orden.variedad', 'variedad')
      .leftJoinAndSelect('orden.categoria_ingreso', 'categoria_ingreso')
      .leftJoinAndSelect('orden.unidad', 'unidad')
      .where('orden.estado = :estado', { estado })
      .orderBy('orden.fecha_creacion', 'DESC');

    // FILTRO POR UNIDAD
    if (rol !== Role.ADMIN && idUnidadUsuario) {
      queryBuilder.andWhere('orden.id_unidad = :idUnidad', {
        idUnidad: idUnidadUsuario,
      });
    }

    return await queryBuilder.getMany();
  }

  async findByUnidad(idUnidad: number): Promise<OrdenIngreso[]> {
    return await this.ordenIngresoRepository.find({
      where: { id_unidad: idUnidad },
      relations: [
        'semillera',
        'cooperador',
        'conductor',
        'vehiculo',
        'semilla',
        'variedad',
        'categoria_ingreso',
      ],
      order: { fecha_creacion: 'DESC' },
    });
  }

  async findByFecha(
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<OrdenIngreso[]> {
    return await this.ordenIngresoRepository.find({
      where: {
        fecha_creacion: Between(fechaInicio, fechaFin),
      },
      relations: [
        'semillera',
        'cooperador',
        'conductor',
        'vehiculo',
        'semilla',
        'variedad',
        'categoria_ingreso',
        'unidad',
      ],
      order: { fecha_creacion: 'DESC' },
    });
  }

  async findOne(
    id: number,
    rol: Role,
    idUnidadUsuario?: number,
  ): Promise<OrdenIngreso> {
    const orden = await this.ordenIngresoRepository.findOne({
      where: { id_orden_ingreso: id },
      relations: [
        'semillera',
        'cooperador',
        'conductor',
        'vehiculo',
        'semilla',
        'variedad',
        'categoria_ingreso',
        'unidad',
        'usuario_creador',
      ],
    });

    if (!orden) {
      throw new NotFoundException(
        `Orden de ingreso con ID ${id} no encontrada`,
      );
    }

    // Validar acceso: Solo admin o usuario de la misma unidad
    if (
      rol !== Role.ADMIN &&
      idUnidadUsuario &&
      orden.id_unidad !== idUnidadUsuario
    ) {
      throw new ForbiddenException('No tienes acceso a esta orden');
    }

    return orden;
  }

  async findByNumeroOrden(numeroOrden: string): Promise<OrdenIngreso> {
    const ordenIngreso = await this.ordenIngresoRepository.findOne({
      where: { numero_orden: numeroOrden },
      relations: [
        'semillera',
        'cooperador',
        'conductor',
        'vehiculo',
        'semilla',
        'variedad',
        'categoria_ingreso',
        'unidad',
        'usuario_creador',
      ],
    });

    if (!ordenIngreso) {
      throw new NotFoundException(
        `Orden de ingreso ${numeroOrden} no encontrada`,
      );
    }

    return ordenIngreso;
  }

  async update(
    id: number,
    updateOrdenIngresoDto: UpdateOrdenIngresoDto,
    rol: Role,
    idUnidadUsuario?: number,
  ): Promise<OrdenIngreso> {
    const ordenIngreso = await this.findOne(id, rol, idUnidadUsuario);

    // No editar órdenes completadas
    if (ordenIngreso.estado === 'completado') {
      throw new BadRequestException(
        'No se puede modificar una orden completada',
      );
    }

    // No editar si tiene lotes de producción
    const lotesAsociados = await this.loteProduccionRepository.count({
      where: { id_orden_ingreso: id },
    });

    if (lotesAsociados > 0) {
      throw new BadRequestException(
        `No se puede editar esta orden porque tiene ${lotesAsociados} lote(s) de producción asociado(s). ` +
          `Si necesitas hacer cambios, primero debes eliminar los lotes de producción.`,
      );
    }

    Object.assign(ordenIngreso, updateOrdenIngresoDto);
    return await this.ordenIngresoRepository.save(ordenIngreso);
  }

  async puedeEditarse(id: number): Promise<{ puede: boolean; razon?: string }> {
    const orden = await this.ordenIngresoRepository.findOne({
      where: { id_orden_ingreso: id },
    });

    if (!orden) {
      return { puede: false, razon: 'Orden no encontrada' };
    }

    if (orden.estado === 'completado') {
      return { puede: false, razon: 'La orden está completada' };
    }

    const lotesCount = await this.loteProduccionRepository.count({
      where: { id_orden_ingreso: id },
    });

    if (lotesCount > 0) {
      return {
        puede: false,
        razon: `Tiene ${lotesCount} lote(s) de producción asociado(s)`,
      };
    }

    return { puede: true };
  }

  async cambiarEstado(
    id: number,
    nuevoEstado: string,
    rol: Role,
    idUnidadUsuario?: number,
  ): Promise<OrdenIngreso> {
    const ordenIngreso = await this.findOne(id, rol, idUnidadUsuario);

    const estadosValidos = [
      'pendiente',
      'en_proceso',
      'completado',
      'cancelado',
    ];
    if (!estadosValidos.includes(nuevoEstado)) {
      throw new BadRequestException('Estado no válido');
    }

    ordenIngreso.estado = nuevoEstado;
    return await this.ordenIngresoRepository.save(ordenIngreso);
  }

  async remove(id: number, rol: Role, idUnidadUsuario?: number): Promise<void> {
    const ordenIngreso = await this.findOne(id, rol, idUnidadUsuario);

    // No eliminar si está completada
    if (ordenIngreso.estado === 'completado') {
      throw new BadRequestException(
        'No se puede eliminar una orden completada',
      );
    }

    // No eliminar si tiene lotes
    const lotesAsociados = await this.loteProduccionRepository.count({
      where: { id_orden_ingreso: id },
    });

    if (lotesAsociados > 0) {
      throw new BadRequestException(
        `No se puede eliminar esta orden porque tiene ${lotesAsociados} lote(s) de producción asociado(s). ` +
          `Primero debes eliminar todos los lotes de producción.`,
      );
    }

    await this.ordenIngresoRepository.remove(ordenIngreso);
  }
  private async generarNumeroOrden(): Promise<string> {
    const fecha = new Date();
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');

    // Contar órdenes del mes actual
    const count = await this.ordenIngresoRepository.count({
      where: {
        numero_orden: Between(
          `OI-${year}${month}-0000`,
          `OI-${year}${month}-9999`,
        ),
      },
    });

    const secuencial = String(count + 1).padStart(4, '0');
    return `OI-${year}${month}-${secuencial}`;
  }

  async getEstadisticas(
    idUnidad?: number,
    rol?: Role,
    idUnidadUsuario?: number,
  ): Promise<any> {
    const queryBuilder = this.ordenIngresoRepository
      .createQueryBuilder('orden')
      .select('orden.estado', 'estado')
      .addSelect('COUNT(orden.id_orden_ingreso)', 'cantidad')
      .addSelect('SUM(orden.peso_neto)', 'peso_total');

    // FILTRO POR UNIDAD: Admin puede filtrar por unidad, otros ven solo la suya
    if (rol !== Role.ADMIN && idUnidadUsuario) {
      queryBuilder.where('orden.id_unidad = :idUnidad', {
        idUnidad: idUnidadUsuario,
      });
    } else if (idUnidad) {
      queryBuilder.where('orden.id_unidad = :idUnidad', { idUnidad });
    }

    const estadisticas = await queryBuilder
      .groupBy('orden.estado')
      .getRawMany();

    return estadisticas;
  }

  async getResumenProduccion(
    id: number,
    rol: Role,
    idUnidadUsuario?: number,
  ): Promise<any> {
    const ordenIngreso = await this.findOne(id, rol, idUnidadUsuario);

    const lotes = await this.loteProduccionRepository.find({
      where: { id_orden_ingreso: id },
    });

    const totalKgProducido = lotes.reduce(
      (sum, lote) => sum + Number(lote.total_kg),
      0,
    );

    const totalBolsasProducidas = lotes.reduce(
      (sum, lote) => sum + lote.nro_bolsas,
      0,
    );

    const pesoDisponible = Number(ordenIngreso.peso_neto) - totalKgProducido;
    const porcentajeUtilizado =
      (totalKgProducido / Number(ordenIngreso.peso_neto)) * 100;

    return {
      orden_ingreso: {
        numero_orden: ordenIngreso.numero_orden,
        peso_neto: ordenIngreso.peso_neto,
      },
      produccion: {
        total_kg_producido: totalKgProducido,
        total_bolsas_producidas: totalBolsasProducidas,
        cantidad_lotes: lotes.length,
        peso_disponible: pesoDisponible,
        porcentaje_utilizado: porcentajeUtilizado.toFixed(2),
      },
      lotes: lotes.map((lote) => ({
        nro_lote: lote.nro_lote,
        nro_bolsas: lote.nro_bolsas,
        kg_por_bolsa: lote.kg_por_bolsa,
        total_kg: lote.total_kg,
        presentacion: lote.presentacion,
      })),
    };
  }
}
