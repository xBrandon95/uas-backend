import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { OrdenSalida } from './entities/orden-salida.entity';
import { DetalleOrdenSalida } from './entities/detalle-orden-salida.entity';
import { CreateOrdenSalidaDto } from './dto/create-orden-salida.dto';
import { UpdateOrdenSalidaDto } from './dto/update-orden-salida.dto';
import { LoteProduccion } from '../lotes-produccion/entities/lote-produccion.entity';
import { MovimientoLote } from '../movimientos-lote/entities/movimiento-lote.entity'; // ✅ AGREGAR
import { PaginationDto } from '../cooperadores/dto/pagination.dto';

@Injectable()
export class OrdenesSalidaService {
  constructor(
    @InjectRepository(OrdenSalida)
    private readonly ordenSalidaRepository: Repository<OrdenSalida>,
    @InjectRepository(DetalleOrdenSalida)
    private readonly detalleRepository: Repository<DetalleOrdenSalida>,
    @InjectRepository(LoteProduccion)
    private readonly loteProduccionRepository: Repository<LoteProduccion>,
    @InjectRepository(MovimientoLote)
    private readonly movimientoLoteRepository: Repository<MovimientoLote>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createOrdenSalidaDto: CreateOrdenSalidaDto,
    idUsuarioCreador: number,
  ): Promise<OrdenSalida> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const numeroOrden = await this.generarNumeroOrden();

      // Validaciones previas (código existente)
      for (const detalle of createOrdenSalidaDto.detalles) {
        const lote = await this.loteProduccionRepository.findOne({
          where: { id_lote_produccion: detalle.id_lote_produccion },
          relations: [
            'orden_ingreso',
            'orden_ingreso.semillera',
            'variedad',
            'variedad.semilla',
          ],
        });

        if (!lote) {
          throw new NotFoundException(
            `Lote ${detalle.id_lote_produccion} no encontrado`,
          );
        }

        if (
          lote.orden_ingreso.id_semillera !== createOrdenSalidaDto.id_semillera
        ) {
          throw new BadRequestException(
            `El lote ${lote.nro_lote} no pertenece a la semillera seleccionada`,
          );
        }

        if (lote.variedad.id_semilla !== createOrdenSalidaDto.id_semilla) {
          throw new BadRequestException(
            `El lote ${lote.nro_lote} no pertenece a la semilla seleccionada`,
          );
        }

        if (lote.cantidad_unidades < detalle.cantidad_unidades) {
          throw new BadRequestException(
            `Lote ${lote.nro_lote} no tiene suficientes unidades. ` +
              `Disponible: ${lote.cantidad_unidades}, Solicitado: ${detalle.cantidad_unidades}`,
          );
        }
      }

      // Crear orden de salida
      const ordenSalida = queryRunner.manager.create(OrdenSalida, {
        ...createOrdenSalidaDto,
        numero_orden: numeroOrden,
        id_usuario_creador: idUsuarioCreador,
        estado: createOrdenSalidaDto.estado || 'pendiente',
        detalles: [],
      });

      const ordenGuardada = await queryRunner.manager.save(ordenSalida);

      // Procesar cada detalle
      for (const detalleDto of createOrdenSalidaDto.detalles) {
        const totalKg = detalleDto.cantidad_unidades * detalleDto.kg_por_unidad;

        // 1. Crear detalle de orden de salida
        const detalle = queryRunner.manager.create(DetalleOrdenSalida, {
          ...detalleDto,
          id_orden_salida: ordenGuardada.id_orden_salida,
          total_kg: totalKg,
        });

        await queryRunner.manager.save(detalle);

        // 2. Obtener el lote
        const lote = await queryRunner.manager.findOne(LoteProduccion, {
          where: { id_lote_produccion: detalleDto.id_lote_produccion },
        });

        // ✅ 3. REGISTRAR MOVIMIENTO DE SALIDA (NUEVO CÓDIGO AQUÍ)
        const movimiento = queryRunner.manager.create(MovimientoLote, {
          id_lote_produccion: lote!.id_lote_produccion,
          tipo_movimiento: 'salida',
          cantidad_unidades: detalleDto.cantidad_unidades,
          kg_movidos: totalKg,
          // Saldos DESPUÉS del movimiento
          saldo_unidades:
            lote!.cantidad_unidades - detalleDto.cantidad_unidades,
          saldo_kg: lote!.total_kg - totalKg,
          // Relaciones
          id_orden_salida: ordenGuardada.id_orden_salida,
          id_usuario: idUsuarioCreador,
          observaciones: `Venta - Orden ${numeroOrden}`,
        });

        await queryRunner.manager.save(movimiento);
        // ✅ FIN DEL CÓDIGO NUEVO

        // 4. Actualizar el lote (código existente)
        lote!.cantidad_unidades -= detalleDto.cantidad_unidades;
        lote!.total_kg -= totalKg;

        if (lote!.cantidad_unidades === 0) {
          lote!.estado = 'vendido';
        } else if (lote!.cantidad_unidades > 0) {
          lote!.estado = 'parcialmente_vendido';
        }

        await queryRunner.manager.save(lote);
      }

      await queryRunner.commitTransaction();
      return await this.findOne(ordenGuardada.id_orden_salida);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ✅ NUEVO MÉTODO: Consultar movimientos de una orden
  async getMovimientosOrden(idOrden: number): Promise<MovimientoLote[]> {
    return await this.movimientoLoteRepository.find({
      where: { id_orden_salida: idOrden },
      relations: ['lote_produccion', 'usuario'],
      order: { fecha_movimiento: 'DESC' },
    });
  }

  // Resto de métodos existentes sin cambios...
  async findAll(
    rol: string,
    idUnidadUsuario?: number,
    paginationDto?: PaginationDto,
  ): Promise<{
    data: OrdenSalida[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    const { search = '', page = 1, limit = 10 } = paginationDto || {};
    const skip = (page - 1) * limit;

    const queryBuilder = this.ordenSalidaRepository
      .createQueryBuilder('orden')
      .leftJoinAndSelect('orden.semillera', 'semillera')
      .leftJoinAndSelect('orden.semilla', 'semilla')
      .leftJoinAndSelect('orden.cliente', 'cliente')
      .leftJoinAndSelect('orden.conductor', 'conductor')
      .leftJoinAndSelect('orden.vehiculo', 'vehiculo')
      .leftJoinAndSelect('orden.unidad', 'unidad')
      .leftJoinAndSelect('orden.usuario_creador', 'usuario_creador')
      .leftJoinAndSelect('orden.detalles', 'detalles')
      .leftJoinAndSelect('detalles.variedad', 'variedad')
      .leftJoinAndSelect('detalles.categoria', 'categoria')
      .leftJoinAndSelect('detalles.lote_produccion', 'lote_produccion');

    if (rol !== 'admin' && idUnidadUsuario) {
      queryBuilder.where('orden.id_unidad = :idUnidad', {
        idUnidad: idUnidadUsuario,
      });
    }

    if (search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      queryBuilder.andWhere(
        '(orden.codigo LIKE :search OR cliente.nombre LIKE :search OR unidad.nombre LIKE :search)',
        { search: searchTerm },
      );
    }

    queryBuilder.orderBy('orden.fecha_creacion', 'DESC');
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
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

  async getLotesDisponiblesFiltrados(
    idSemillera: number,
    idSemilla: number,
    rol: string,
    idUnidadUsuario?: number,
  ): Promise<LoteProduccion[]> {
    const queryBuilder = this.loteProduccionRepository
      .createQueryBuilder('lote')
      .leftJoinAndSelect('lote.variedad', 'variedad')
      .leftJoinAndSelect('variedad.semilla', 'semilla')
      .leftJoinAndSelect('lote.categoria_salida', 'categoria_salida')
      .leftJoinAndSelect('lote.unidad', 'unidad')
      .leftJoinAndSelect('lote.orden_ingreso', 'orden_ingreso')
      .leftJoinAndSelect('orden_ingreso.semillera', 'semillera')
      .where('lote.estado IN (:...estados)', {
        estados: ['disponible', 'parcialmente_vendido'],
      })
      .andWhere('lote.cantidad_unidades > 0')
      .andWhere('orden_ingreso.id_semillera = :idSemillera', { idSemillera })
      .andWhere('variedad.id_semilla = :idSemilla', { idSemilla });

    if (rol !== 'admin' && idUnidadUsuario) {
      queryBuilder.andWhere('lote.id_unidad = :idUnidad', {
        idUnidad: idUnidadUsuario,
      });
    }

    queryBuilder.orderBy('lote.fecha_creacion', 'DESC');

    return await queryBuilder.getMany();
  }

  async getLotesDisponiblesPorUnidad(
    rol: string,
    idUnidadUsuario?: number,
  ): Promise<LoteProduccion[]> {
    const queryBuilder = this.loteProduccionRepository
      .createQueryBuilder('lote')
      .leftJoinAndSelect('lote.variedad', 'variedad')
      .leftJoinAndSelect('variedad.semilla', 'semilla')
      .leftJoinAndSelect('lote.categoria_salida', 'categoria_salida')
      .leftJoinAndSelect('lote.unidad', 'unidad')
      .where('lote.estado IN (:...estados)', {
        estados: ['disponible', 'parcialmente_vendido'],
      })
      .andWhere('lote.cantidad_unidades > 0');

    if (rol !== 'admin' && idUnidadUsuario) {
      queryBuilder.andWhere('lote.id_unidad = :idUnidad', {
        idUnidad: idUnidadUsuario,
      });
    }

    queryBuilder.orderBy('lote.fecha_creacion', 'DESC');

    return await queryBuilder.getMany();
  }

  async findByEstado(estado: string): Promise<OrdenSalida[]> {
    return await this.ordenSalidaRepository.find({
      where: { estado },
      relations: [
        'semillera',
        'cliente',
        'conductor',
        'vehiculo',
        'detalles',
        'detalles.variedad',
        'detalles.categoria',
      ],
      order: { fecha_creacion: 'DESC' },
    });
  }

  async findByUnidad(idUnidad: number): Promise<OrdenSalida[]> {
    return await this.ordenSalidaRepository.find({
      where: { id_unidad: idUnidad },
      relations: ['semillera', 'cliente', 'conductor', 'vehiculo', 'detalles'],
      order: { fecha_creacion: 'DESC' },
    });
  }

  async findByCliente(idCliente: number): Promise<OrdenSalida[]> {
    return await this.ordenSalidaRepository.find({
      where: { id_cliente: idCliente },
      relations: ['detalles', 'detalles.variedad'],
      order: { fecha_creacion: 'DESC' },
    });
  }

  async findByFecha(fechaInicio: Date, fechaFin: Date): Promise<OrdenSalida[]> {
    return await this.ordenSalidaRepository.find({
      where: {
        fecha_salida: Between(fechaInicio, fechaFin),
      },
      relations: [
        'semillera',
        'cliente',
        'detalles',
        'detalles.variedad',
        'detalles.categoria',
      ],
      order: { fecha_salida: 'DESC' },
    });
  }

  async findOne(id: number): Promise<OrdenSalida> {
    const orden = await this.ordenSalidaRepository.findOne({
      where: { id_orden_salida: id },
      relations: [
        'semillera',
        'semilla',
        'cliente',
        'conductor',
        'vehiculo',
        'unidad',
        'usuario_creador',
        'detalles',
        'detalles.variedad',
        'detalles.categoria',
        'detalles.lote_produccion',
      ],
    });

    if (!orden) {
      throw new NotFoundException(`Orden de salida con ID ${id} no encontrada`);
    }

    return orden;
  }

  async findByNumeroOrden(numeroOrden: string): Promise<OrdenSalida> {
    const orden = await this.ordenSalidaRepository.findOne({
      where: { numero_orden: numeroOrden },
      relations: [
        'semillera',
        'cliente',
        'conductor',
        'vehiculo',
        'unidad',
        'usuario_creador',
        'detalles',
        'detalles.variedad',
        'detalles.categoria',
      ],
    });

    if (!orden) {
      throw new NotFoundException(`Orden ${numeroOrden} no encontrada`);
    }

    return orden;
  }

  async update(
    id: number,
    updateOrdenSalidaDto: UpdateOrdenSalidaDto,
  ): Promise<OrdenSalida> {
    const orden = await this.findOne(id);

    if (orden.estado === 'completado') {
      throw new BadRequestException(
        'No se puede modificar una orden completada',
      );
    }

    Object.assign(orden, updateOrdenSalidaDto);
    await this.ordenSalidaRepository.save(orden);

    return await this.findOne(id);
  }

  async cambiarEstado(id: number, nuevoEstado: string): Promise<OrdenSalida> {
    const orden = await this.findOne(id);

    const estadosValidos = [
      'pendiente',
      'en_transito',
      'completado',
      'cancelado',
    ];
    if (!estadosValidos.includes(nuevoEstado)) {
      throw new BadRequestException('Estado no válido');
    }

    orden.estado = nuevoEstado;
    return await this.ordenSalidaRepository.save(orden);
  }

  async remove(id: number): Promise<void> {
    const orden = await this.findOne(id);

    if (orden.estado === 'completado') {
      throw new BadRequestException(
        'No se puede eliminar una orden completada',
      );
    }

    await this.ordenSalidaRepository.remove(orden);
  }

  private async generarNumeroOrden(): Promise<string> {
    const fecha = new Date();
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');

    const count = await this.ordenSalidaRepository.count({
      where: {
        numero_orden: Between(
          `OS-${year}${month}-0000`,
          `OS-${year}${month}-9999`,
        ),
      },
    });

    const secuencial = String(count + 1).padStart(4, '0');
    return `OS-${year}${month}-${secuencial}`;
  }

  async getEstadisticas(idUnidad?: number): Promise<any> {
    const queryBuilder = this.ordenSalidaRepository
      .createQueryBuilder('orden')
      .leftJoin('orden.detalles', 'detalle')
      .select('orden.estado', 'estado')
      .addSelect('COUNT(orden.id_orden_salida)', 'cantidad')
      .addSelect('SUM(detalle.total_kg)', 'peso_total');

    if (idUnidad) {
      queryBuilder.where('orden.id_unidad = :idUnidad', { idUnidad });
    }

    const estadisticas = await queryBuilder
      .groupBy('orden.estado')
      .getRawMany();

    return estadisticas;
  }
}
