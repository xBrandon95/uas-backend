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

@Injectable()
export class OrdenesSalidaService {
  constructor(
    @InjectRepository(OrdenSalida)
    private readonly ordenSalidaRepository: Repository<OrdenSalida>,
    @InjectRepository(DetalleOrdenSalida)
    private readonly detalleRepository: Repository<DetalleOrdenSalida>,
    @InjectRepository(LoteProduccion)
    private readonly loteProduccionRepository: Repository<LoteProduccion>,
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
      // Generar número de orden
      const numeroOrden = await this.generarNumeroOrden();

      // Validar disponibilidad de lotes
      for (const detalle of createOrdenSalidaDto.detalles) {
        const lote = await this.loteProduccionRepository.findOne({
          where: { id_lote_produccion: detalle.id_lote_produccion },
        });

        if (!lote) {
          throw new NotFoundException(
            `Lote ${detalle.id_lote_produccion} no encontrado`,
          );
        }

        if (lote.nro_bolsas < detalle.nro_bolsas) {
          throw new BadRequestException(
            `Lote ${lote.nro_lote} no tiene suficientes bolsas. Disponible: ${lote.nro_bolsas}, Solicitado: ${detalle.nro_bolsas}`,
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

      // Crear detalles y actualizar lotes
      for (const detalleDto of createOrdenSalidaDto.detalles) {
        const totalKg = detalleDto.nro_bolsas * detalleDto.kg_bolsa;

        const detalle = queryRunner.manager.create(DetalleOrdenSalida, {
          ...detalleDto,
          id_orden_salida: ordenGuardada.id_orden_salida,
          total_kg: totalKg,
        });

        await queryRunner.manager.save(detalle);

        // Actualizar lote de producción
        const lote = await queryRunner.manager.findOne(LoteProduccion, {
          where: { id_lote_produccion: detalleDto.id_lote_produccion },
        });

        lote!.nro_bolsas -= detalleDto.nro_bolsas;
        lote!.total_kg -= totalKg;

        if (lote!.nro_bolsas === 0) {
          lote!.estado = 'vendido';
        } else if (lote!.nro_bolsas > 0) {
          lote!.estado = 'parcialmente_vendido';
        }

        await queryRunner.manager.save(lote);
      }

      await queryRunner.commitTransaction();

      // Retornar orden completa con relaciones
      return await this.findOne(ordenGuardada.id_orden_salida);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Modificar findAll para aceptar filtros por rol
  async findAll(rol: string, idUnidadUsuario?: number): Promise<OrdenSalida[]> {
    const queryBuilder = this.ordenSalidaRepository
      .createQueryBuilder('orden')
      .leftJoinAndSelect('orden.semillera', 'semillera')
      .leftJoinAndSelect('orden.cliente', 'cliente')
      .leftJoinAndSelect('orden.conductor', 'conductor')
      .leftJoinAndSelect('orden.vehiculo', 'vehiculo')
      .leftJoinAndSelect('orden.unidad', 'unidad')
      .leftJoinAndSelect('orden.usuario_creador', 'usuario_creador')
      .leftJoinAndSelect('orden.detalles', 'detalles')
      .leftJoinAndSelect('detalles.variedad', 'variedad')
      .leftJoinAndSelect('detalles.categoria', 'categoria')
      .leftJoinAndSelect('detalles.lote_produccion', 'lote_produccion');

    // Si no es admin, filtrar por unidad
    if (rol !== 'admin' && idUnidadUsuario) {
      queryBuilder.where('orden.id_unidad = :idUnidad', {
        idUnidad: idUnidadUsuario,
      });
    }

    queryBuilder.orderBy('orden.fecha_creacion', 'DESC');

    return await queryBuilder.getMany();
  }

  // Agregar método para obtener lotes disponibles por unidad
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
      .andWhere('lote.nro_bolsas > 0');

    // Si no es admin, filtrar por unidad
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
