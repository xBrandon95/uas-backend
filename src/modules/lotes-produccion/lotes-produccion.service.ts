import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { LoteProduccion } from './entities/lote-produccion.entity';
import { CreateLoteProduccionDto } from './dto/create-lote-produccion.dto';
import { UpdateLoteProduccionDto } from './dto/update-lote-produccion.dto';
import { OrdenIngreso } from '../ordenes-ingreso/entities/orden-ingreso.entity';
import { Role } from 'src/common/enums/roles.enum';
import { MovimientoLote } from '../movimientos-lote/entities/movimiento-lote.entity';

@Injectable()
export class LotesProduccionService {
  constructor(
    @InjectRepository(LoteProduccion)
    private readonly loteProduccionRepository: Repository<LoteProduccion>,
    @InjectRepository(OrdenIngreso)
    private readonly ordenIngresoRepository: Repository<OrdenIngreso>,
    @InjectRepository(MovimientoLote)
    private readonly movimientoRepository: Repository<MovimientoLote>,
  ) {}

  async create(
    createLoteProduccionDto: CreateLoteProduccionDto,
    idUsuarioCreador: number,
  ): Promise<LoteProduccion> {
    const ordenIngreso = await this.ordenIngresoRepository.findOne({
      where: { id_orden_ingreso: createLoteProduccionDto.id_orden_ingreso },
    });

    if (!ordenIngreso) {
      throw new NotFoundException(
        `Orden de ingreso ${createLoteProduccionDto.id_orden_ingreso} no encontrada`,
      );
    }

    if (ordenIngreso.estado === 'cancelado') {
      throw new BadRequestException(
        'No se pueden crear lotes de producción en una orden cancelada.',
      );
    }

    const lotesExistentes = await this.loteProduccionRepository.find({
      where: { id_orden_ingreso: createLoteProduccionDto.id_orden_ingreso },
    });

    // ✅ CORRECCIÓN: Usar total_kg_original en lugar de total_kg
    const totalKgProducido = lotesExistentes.reduce(
      (sum, lote) => sum + Number(lote.total_kg_original),
      0,
    );

    const nuevoLoteKg =
      createLoteProduccionDto.cantidad_unidades *
      createLoteProduccionDto.kg_por_unidad;

    const totalDespuesDeCrear = totalKgProducido + nuevoLoteKg;

    if (totalDespuesDeCrear > Number(ordenIngreso.peso_neto)) {
      throw new BadRequestException(
        `No se puede crear el lote. ` +
          `Peso neto orden de ingreso: ${ordenIngreso.peso_neto} kg. ` +
          `Ya producido: ${totalKgProducido.toFixed(2)} kg. ` +
          `Nuevo lote: ${nuevoLoteKg.toFixed(2)} kg. ` +
          `Total sería: ${totalDespuesDeCrear.toFixed(2)} kg ` +
          `(excede en ${(
            totalDespuesDeCrear - Number(ordenIngreso.peso_neto)
          ).toFixed(2)} kg)`,
      );
    }

    const numeroLote = await this.generarNumeroLote();

    const totalKg =
      createLoteProduccionDto.cantidad_unidades *
      createLoteProduccionDto.kg_por_unidad;

    const loteProduccion = this.loteProduccionRepository.create({
      ...createLoteProduccionDto,
      nro_lote: numeroLote,
      total_kg: totalKg,
      cantidad_original: createLoteProduccionDto.cantidad_unidades,
      total_kg_original: totalKg,
      id_usuario_creador: idUsuarioCreador,
      estado: createLoteProduccionDto.estado || 'disponible',
    });

    const loteGuardado = await this.loteProduccionRepository.save(
      loteProduccion,
    );

    const movimientoEntrada = this.movimientoRepository.create({
      id_lote_produccion: loteGuardado.id_lote_produccion,
      tipo_movimiento: 'entrada',
      cantidad_unidades: createLoteProduccionDto.cantidad_unidades,
      kg_movidos: totalKg,
      saldo_unidades: createLoteProduccionDto.cantidad_unidades,
      saldo_kg: totalKg,
      id_usuario: idUsuarioCreador,
      observaciones: `Entrada inicial - Lote ${numeroLote}`,
    });

    await this.movimientoRepository.save(movimientoEntrada);

    await this.actualizarEstadoOrden(ordenIngreso.id_orden_ingreso);

    return loteGuardado;
  }

  private async actualizarEstadoOrden(idOrden: number): Promise<void> {
    const ordenIngreso = await this.ordenIngresoRepository.findOne({
      where: { id_orden_ingreso: idOrden },
    });

    if (!ordenIngreso) {
      return;
    }

    // No actualizar automáticamente si está cancelada (solo manual)
    if (ordenIngreso.estado === 'cancelado') {
      return;
    }

    const lotes = await this.loteProduccionRepository.find({
      where: { id_orden_ingreso: idOrden },
    });

    const totalKgProducido = lotes.reduce(
      (sum, lote) => sum + Number(lote.total_kg_original),
      0,
    );

    const porcentajeUtilizado =
      (totalKgProducido / Number(ordenIngreso.peso_neto)) * 100;

    // LÓGICA DE TRANSICIÓN AUTOMÁTICA DE ESTADOS
    const estadoAnterior = ordenIngreso.estado;

    if (lotes.length === 0) {
      // Sin lotes → Pendiente
      ordenIngreso.estado = 'pendiente';
    } else if (porcentajeUtilizado >= 100) {
      // 100% utilizado → Completado
      ordenIngreso.estado = 'completado';
    } else if (lotes.length > 0 && porcentajeUtilizado < 100) {
      // Tiene lotes pero no al 100% → En proceso
      if (ordenIngreso.estado !== 'completado') {
        // No sobrescribir si fue marcado manualmente como completado
        ordenIngreso.estado = 'en_proceso';
      }
    }

    // Log para auditoría
    if (estadoAnterior !== ordenIngreso.estado) {
      console.log(
        `[AUTO] Orden ${ordenIngreso.numero_orden}: ${estadoAnterior} → ${ordenIngreso.estado} ` +
          `(${porcentajeUtilizado.toFixed(2)}% utilizado, ${
            lotes.length
          } lote(s))`,
      );
    }

    await this.ordenIngresoRepository.save(ordenIngreso);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search: string = '',
    rol: Role,
    idUnidadUsuario?: number,
  ): Promise<{ data: LoteProduccion[]; meta: any }> {
    const skip = (page - 1) * limit;

    const queryBuilder = this.loteProduccionRepository
      .createQueryBuilder('lote')
      .leftJoinAndSelect('lote.orden_ingreso', 'orden_ingreso')
      .leftJoinAndSelect('lote.variedad', 'variedad')
      .leftJoinAndSelect('variedad.semilla', 'semilla')
      .leftJoinAndSelect('lote.categoria_salida', 'categoria_salida')
      .leftJoinAndSelect('lote.unidad', 'unidad')
      .leftJoinAndSelect('lote.usuario_creador', 'usuario_creador')
      .orderBy('lote.fecha_creacion', 'DESC');

    // Filtro por unidad (solo admin puede ver todas las unidades)
    if (rol !== Role.ADMIN && idUnidadUsuario) {
      queryBuilder.where('lote.id_unidad = :idUnidad', {
        idUnidad: idUnidadUsuario,
      });
    }

    // Búsqueda general
    if (search) {
      const whereCondition =
        rol !== Role.ADMIN && idUnidadUsuario
          ? 'lote.id_unidad = :idUnidad AND '
          : '';

      queryBuilder.andWhere(
        `${whereCondition}(
        lote.nro_lote LIKE :search OR
        variedad.nombre LIKE :search OR
        categoria_salida.nombre LIKE :search OR
        unidad.nombre LIKE :search OR
        usuario_creador.nombre LIKE :search OR
        orden_ingreso.numero_orden LIKE :search
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

  async findByEstado(estado: string): Promise<LoteProduccion[]> {
    return await this.loteProduccionRepository.find({
      where: { estado },
      relations: ['orden_ingreso', 'variedad', 'categoria_salida', 'unidad'],
      order: { fecha_creacion: 'DESC' },
    });
  }

  async findDisponibles(): Promise<LoteProduccion[]> {
    return await this.findByEstado('disponible');
  }

  async findByUnidad(idUnidad: number): Promise<LoteProduccion[]> {
    return await this.loteProduccionRepository.find({
      where: { id_unidad: idUnidad },
      relations: ['orden_ingreso', 'variedad', 'categoria_salida'],
      order: { fecha_creacion: 'DESC' },
    });
  }

  async findByVariedad(idVariedad: number): Promise<LoteProduccion[]> {
    return await this.loteProduccionRepository.find({
      where: { id_variedad: idVariedad },
      relations: ['categoria_salida', 'unidad'],
      order: { fecha_creacion: 'DESC' },
    });
  }

  async findByOrdenIngreso(idOrdenIngreso: number): Promise<LoteProduccion[]> {
    return await this.loteProduccionRepository.find({
      where: { id_orden_ingreso: idOrdenIngreso },
      relations: ['variedad', 'categoria_salida'],
      order: { fecha_creacion: 'DESC' },
    });
  }

  async findOne(id: number): Promise<LoteProduccion> {
    const lote = await this.loteProduccionRepository.findOne({
      where: { id_lote_produccion: id },
      relations: [
        'orden_ingreso',
        'variedad',
        'categoria_salida',
        'unidad',
        'usuario_creador',
      ],
    });

    if (!lote) {
      throw new NotFoundException(
        `Lote de producción con ID ${id} no encontrado`,
      );
    }

    return lote;
  }

  async findByNumeroLote(numeroLote: string): Promise<LoteProduccion> {
    const lote = await this.loteProduccionRepository.findOne({
      where: { nro_lote: numeroLote },
      relations: [
        'orden_ingreso',
        'variedad',
        'categoria_salida',
        'unidad',
        'usuario_creador',
      ],
    });

    if (!lote) {
      throw new NotFoundException(`Lote ${numeroLote} no encontrado`);
    }

    return lote;
  }

  async update(
    id: number,
    updateLoteProduccionDto: UpdateLoteProduccionDto,
  ): Promise<LoteProduccion> {
    const lote = await this.findOne(id);

    if (lote.estado === 'vendido') {
      throw new BadRequestException('No se puede modificar un lote vendido');
    }

    if (
      updateLoteProduccionDto.cantidad_unidades ||
      updateLoteProduccionDto.kg_por_unidad
    ) {
      const cantidadUnidades =
        updateLoteProduccionDto.cantidad_unidades || lote.cantidad_unidades;
      const kgPorUnidad =
        updateLoteProduccionDto.kg_por_unidad || lote.kg_por_unidad;
      updateLoteProduccionDto['total_kg'] = cantidadUnidades * kgPorUnidad;
    }

    Object.assign(lote, updateLoteProduccionDto);
    const loteActualizado = await this.loteProduccionRepository.save(lote);

    await this.actualizarEstadoOrden(lote.id_orden_ingreso);

    return loteActualizado;
  }

  async cambiarEstado(
    id: number,
    nuevoEstado: string,
  ): Promise<LoteProduccion> {
    const lote = await this.findOne(id);

    const estadosValidos = [
      'disponible',
      'reservado',
      'parcialmente_vendido',
      'vendido',
      'descartado',
    ];
    if (!estadosValidos.includes(nuevoEstado)) {
      throw new BadRequestException('Estado no válido');
    }

    lote.estado = nuevoEstado;
    return await this.loteProduccionRepository.save(lote);
  }

  async remove(id: number): Promise<void> {
    const lote = await this.findOne(id);

    if (lote.estado === 'vendido') {
      throw new BadRequestException('No se puede eliminar un lote vendido');
    }

    const idOrdenIngreso = lote.id_orden_ingreso;

    await this.loteProduccionRepository.remove(lote);

    // ✅ Recalcular estado de la orden automáticamente
    await this.actualizarEstadoOrden(idOrdenIngreso);
  }

  private async generarNumeroLote(): Promise<string> {
    const fecha = new Date();
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');

    // Contar lotes del mes actual
    const count = await this.loteProduccionRepository.count({
      where: {
        nro_lote: Between(`LP-${year}${month}-0000`, `LP-${year}${month}-9999`),
      },
    });

    const secuencial = String(count + 1).padStart(4, '0');
    return `LP-${year}${month}-${secuencial}`;
  }

  async getInventarioPorVariedad(
    rol: string,
    idUnidadUsuario?: number,
    idUnidadFiltro?: number,
    idSemilla?: number,
    idVariedad?: number,
    idCategoria?: number,
    fechaInicio?: string,
    fechaFin?: string,
  ): Promise<any[]> {
    const queryBuilder = this.loteProduccionRepository
      .createQueryBuilder('lote')
      .leftJoin('lote.variedad', 'variedad')
      .leftJoin('variedad.semilla', 'semilla')
      .leftJoin('lote.categoria_salida', 'categoria')
      .select('variedad.nombre', 'variedad')
      .addSelect('semilla.nombre', 'semilla')
      .addSelect('categoria.nombre', 'categoria')
      .addSelect('SUM(lote.cantidad_unidades)', 'total_unidades')
      .addSelect('SUM(lote.total_kg)', 'total_kg')
      .where('lote.estado IN (:...estados)', {
        estados: ['disponible', 'parcialmente_vendido'],
      });

    // Filtro por rol y unidad
    if (rol !== 'admin') {
      queryBuilder.andWhere('lote.id_unidad = :idUnidad', {
        idUnidad: idUnidadUsuario,
      });
    } else if (idUnidadFiltro) {
      queryBuilder.andWhere('lote.id_unidad = :idUnidad', {
        idUnidad: idUnidadFiltro,
      });
    }

    // Filtros opcionales existentes
    if (idSemilla) {
      queryBuilder.andWhere('semilla.id_semilla = :idSemilla', { idSemilla });
    }

    if (idVariedad) {
      queryBuilder.andWhere('variedad.id_variedad = :idVariedad', {
        idVariedad,
      });
    }

    if (idCategoria) {
      queryBuilder.andWhere('categoria.id_categoria = :idCategoria', {
        idCategoria,
      });
    }

    if (fechaInicio && fechaFin) {
      queryBuilder.andWhere(
        'DATE(lote.fecha_creacion) BETWEEN :fechaInicio AND :fechaFin',
        {
          fechaInicio,
          fechaFin,
        },
      );
    } else if (fechaInicio) {
      queryBuilder.andWhere('DATE(lote.fecha_creacion) >= :fechaInicio', {
        fechaInicio,
      });
    } else if (fechaFin) {
      queryBuilder.andWhere('DATE(lote.fecha_creacion) <= :fechaFin', {
        fechaFin,
      });
    }

    queryBuilder
      .groupBy('variedad.id_variedad')
      .addGroupBy('semilla.nombre')
      .addGroupBy('categoria.id_categoria');

    return await queryBuilder.getRawMany();
  }

  async getEstadisticas(idUnidad?: number): Promise<any> {
    const queryBuilder = this.loteProduccionRepository
      .createQueryBuilder('lote')
      .select('lote.estado', 'estado')
      .addSelect('COUNT(lote.id_lote_produccion)', 'cantidad')
      .addSelect('SUM(lote.total_kg)', 'peso_total')
      .addSelect('SUM(lote.cantidad_unidades)', 'total_unidades');

    if (idUnidad) {
      queryBuilder.where('lote.id_unidad = :idUnidad', { idUnidad });
    }

    return await queryBuilder.groupBy('lote.estado').getRawMany();
  }
}
