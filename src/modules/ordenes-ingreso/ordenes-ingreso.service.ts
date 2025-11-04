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
      .orderBy('orden.fecha_creacion', 'DESC');

    // FILTRO POR UNIDAD: Solo admin puede ver todas las unidades
    if (rol !== Role.ADMIN && idUnidadUsuario) {
      queryBuilder.where('orden.id_unidad = :idUnidad', {
        idUnidad: idUnidadUsuario,
      });
    }

    // Búsqueda
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

    // Obtener total y datos paginados
    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data,
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

    // Validar que la orden esté en estado editable
    if (ordenIngreso.estado === 'completado') {
      throw new BadRequestException(
        'No se puede modificar una orden completada',
      );
    }

    Object.assign(ordenIngreso, updateOrdenIngresoDto);
    return await this.ordenIngresoRepository.save(ordenIngreso);
  }

  async cambiarEstado(
    id: number,
    nuevoEstado: string,
    rol: Role,
    idUnidadUsuario?: number,
  ): Promise<OrdenIngreso> {
    const ordenIngreso = await this.findOne(id, rol, idUnidadUsuario);

    // ✅ RESTRICCIÓN 1: Solo permitir cambios manuales a "completado" o "cancelado"
    const estadosPermitidosManualmente = ['completado', 'cancelado'];
    if (!estadosPermitidosManualmente.includes(nuevoEstado)) {
      throw new BadRequestException(
        'Solo puedes cambiar manualmente el estado a "Completado" o "Cancelado"',
      );
    }

    // ✅ RESTRICCIÓN 2: No permitir cambios si ya está "completado" o "cancelado"
    if (
      ordenIngreso.estado === 'completado' ||
      ordenIngreso.estado === 'cancelado'
    ) {
      throw new BadRequestException(
        `No se puede cambiar el estado de una orden que ya está "${ordenIngreso.estado}". ` +
          'Esta acción es irreversible.',
      );
    }

    // ✅ VALIDACIÓN: No permitir cancelar si tiene lotes
    if (nuevoEstado === 'cancelado') {
      const lotesCount = await this.loteProduccionRepository.count({
        where: { id_orden_ingreso: id },
      });

      if (lotesCount > 0) {
        throw new BadRequestException(
          `No se puede cancelar una orden que tiene ${lotesCount} lote(s) de producción asociado(s). ` +
            'Primero debe eliminar todos los lotes.',
        );
      }
    }

    // ✅ VALIDACIÓN: Advertencia al marcar como completado manualmente
    if (nuevoEstado === 'completado') {
      const lotes = await this.loteProduccionRepository.find({
        where: { id_orden_ingreso: id },
      });

      if (lotes.length === 0) {
        throw new BadRequestException(
          'No se puede marcar como completada una orden sin lotes de producción. ' +
            'Primero debe crear al menos un lote.',
        );
      }

      const totalKgProducido = lotes.reduce(
        (sum, l) => sum + Number(l.total_kg_original),
        0,
      );

      const porcentaje =
        (totalKgProducido / Number(ordenIngreso.peso_neto)) * 100;

      // Log para auditoría
      console.log(
        `[MANUAL] Orden ${ordenIngreso.numero_orden} marcada como completada manualmente. ` +
          `Peso utilizado: ${porcentaje.toFixed(
            2,
          )}% (${totalKgProducido.toFixed(2)}/${ordenIngreso.peso_neto} kg)`,
      );
    }

    const estadoAnterior = ordenIngreso.estado;
    ordenIngreso.estado = nuevoEstado;

    const ordenActualizada = await this.ordenIngresoRepository.save(
      ordenIngreso,
    );

    // Log para auditoría
    console.log(
      `[MANUAL] Orden ${ordenIngreso.numero_orden}: ${estadoAnterior} → ${nuevoEstado} (Cambio irreversible)`,
    );

    return ordenActualizada;
  }

  async remove(id: number, rol: Role, idUnidadUsuario?: number): Promise<void> {
    const ordenIngreso = await this.findOne(id, rol, idUnidadUsuario);

    if (ordenIngreso.estado === 'completado') {
      throw new BadRequestException(
        'No se puede eliminar una orden completada',
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
      relations: ['variedad', 'categoria_salida'],
    });

    const totalKgProducido = lotes.reduce(
      (sum, lote) => sum + Number(lote.total_kg_original),
      0,
    );
    const totalUnidadesProducidas = lotes.reduce(
      (sum, lote) => sum + lote.cantidad_original,
      0,
    );

    const pesoDisponible = Number(ordenIngreso.peso_neto) - totalKgProducido;
    const porcentajeUtilizado =
      (totalKgProducido / Number(ordenIngreso.peso_neto)) * 100;

    return {
      orden_ingreso: {
        numero_orden: ordenIngreso.numero_orden,
        peso_neto: ordenIngreso.peso_neto,
        estado: ordenIngreso.estado,
      },
      produccion: {
        total_kg_producido: totalKgProducido.toFixed(2),
        total_unidades_producidas: totalUnidadesProducidas, // ✅ CAMBIADO
        cantidad_lotes: lotes.length,
        peso_disponible: pesoDisponible.toFixed(2),
        porcentaje_utilizado: porcentajeUtilizado.toFixed(2),
      },
      lotes: lotes.map((lote) => ({
        nro_lote: lote.nro_lote,
        variedad: lote.variedad?.nombre,
        categoria: lote.categoria_salida?.nombre,
        cantidad_unidades: lote.cantidad_unidades, // ✅ CAMBIADO
        kg_por_unidad: Number(lote.kg_por_unidad).toFixed(2), // ✅ CAMBIADO
        total_kg: Number(lote.total_kg).toFixed(2),
        estado: lote.estado,
        presentacion: lote.presentacion,
      })),
    };
  }

  async findDisponiblesParaLotes(
    rol: Role,
    idUnidadUsuario?: number,
  ): Promise<OrdenIngreso[]> {
    const queryBuilder = this.ordenIngresoRepository
      .createQueryBuilder('orden')
      .leftJoinAndSelect('orden.semillera', 'semillera')
      .leftJoinAndSelect('orden.cooperador', 'cooperador')
      .leftJoinAndSelect('orden.semilla', 'semilla')
      .leftJoinAndSelect('orden.variedad', 'variedad')
      .leftJoinAndSelect('orden.unidad', 'unidad')
      .where('orden.estado IN (:...estados)', {
        estados: ['pendiente', 'en_proceso'],
      })
      .orderBy('orden.fecha_creacion', 'DESC');

    // Filtro por unidad si no es admin
    if (rol !== Role.ADMIN && idUnidadUsuario) {
      queryBuilder.andWhere('orden.id_unidad = :idUnidad', {
        idUnidad: idUnidadUsuario,
      });
    }

    return await queryBuilder.getMany();
  }
}
