import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { OrdenIngreso } from './entities/orden-ingreso.entity';
import { CreateOrdenIngresoDto } from './dto/create-orden-ingreso.dto';
import { UpdateOrdenIngresoDto } from './dto/update-orden-ingreso.dto';
import { LoteProduccion } from '../lotes-produccion/entities/lote-produccion.entity';

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
  ): Promise<OrdenIngreso> {
    // Generar número de orden automático
    const numeroOrden = await this.generarNumeroOrden();

    const ordenIngreso = this.ordenIngresoRepository.create({
      ...createOrdenIngresoDto,
      numero_orden: numeroOrden,
      id_usuario_creador: idUsuarioCreador,
      estado: createOrdenIngresoDto.estado || 'pendiente',
    });

    return await this.ordenIngresoRepository.save(ordenIngreso);
  }

  async findAll(): Promise<OrdenIngreso[]> {
    return await this.ordenIngresoRepository.find({
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
      order: { fecha_creacion: 'DESC' },
    });
  }

  async findByEstado(estado: string): Promise<OrdenIngreso[]> {
    return await this.ordenIngresoRepository.find({
      where: { estado },
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

  async findOne(id: number): Promise<OrdenIngreso> {
    const ordenIngreso = await this.ordenIngresoRepository.findOne({
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

    if (!ordenIngreso) {
      throw new NotFoundException(
        `Orden de ingreso con ID ${id} no encontrada`,
      );
    }

    return ordenIngreso;
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
  ): Promise<OrdenIngreso> {
    const ordenIngreso = await this.findOne(id);

    // Validar que la orden esté en estado editable
    if (ordenIngreso.estado === 'completado') {
      throw new BadRequestException(
        'No se puede modificar una orden completada',
      );
    }

    Object.assign(ordenIngreso, updateOrdenIngresoDto);
    return await this.ordenIngresoRepository.save(ordenIngreso);
  }

  async cambiarEstado(id: number, nuevoEstado: string): Promise<OrdenIngreso> {
    const ordenIngreso = await this.findOne(id);

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

  async remove(id: number): Promise<void> {
    const ordenIngreso = await this.findOne(id);

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

  async getEstadisticas(idUnidad?: number): Promise<any> {
    const queryBuilder = this.ordenIngresoRepository
      .createQueryBuilder('orden')
      .select('orden.estado', 'estado')
      .addSelect('COUNT(orden.id_orden_ingreso)', 'cantidad')
      .addSelect('SUM(orden.peso_neto)', 'peso_total');

    if (idUnidad) {
      queryBuilder.where('orden.id_unidad = :idUnidad', { idUnidad });
    }

    const estadisticas = await queryBuilder
      .groupBy('orden.estado')
      .getRawMany();

    return estadisticas;
  }

  async getResumenProduccion(idOrdenIngreso: number): Promise<any> {
    const ordenIngreso = await this.findOne(idOrdenIngreso);

    const lotes = await this.loteProduccionRepository.find({
      where: { id_orden_ingreso: idOrdenIngreso },
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
        nro_bolsas_ingresadas: ordenIngreso.nro_bolsas,
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
