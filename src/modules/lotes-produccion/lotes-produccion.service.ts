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

@Injectable()
export class LotesProduccionService {
  constructor(
    @InjectRepository(LoteProduccion)
    private readonly loteProduccionRepository: Repository<LoteProduccion>,
  ) {}

  async create(
    createLoteProduccionDto: CreateLoteProduccionDto,
    idUsuarioCreador: number,
  ): Promise<LoteProduccion> {
    // Generar número de lote automático
    const numeroLote = await this.generarNumeroLote();

    // Calcular total_kg
    const totalKg =
      createLoteProduccionDto.nro_bolsas * createLoteProduccionDto.kg_por_bolsa;

    const loteProduccion = this.loteProduccionRepository.create({
      ...createLoteProduccionDto,
      nro_lote: numeroLote,
      total_kg: totalKg,
      id_usuario_creador: idUsuarioCreador,
      estado: createLoteProduccionDto.estado || 'disponible',
    });

    return await this.loteProduccionRepository.save(loteProduccion);
  }

  async findAll(): Promise<LoteProduccion[]> {
    return await this.loteProduccionRepository.find({
      relations: [
        'orden_ingreso',
        'variedad',
        'categoria_salida',
        'unidad',
        'usuario_creador',
      ],
      order: { fecha_creacion: 'DESC' },
    });
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

    // Validar que el lote esté en estado editable
    if (lote.estado === 'vendido') {
      throw new BadRequestException('No se puede modificar un lote vendido');
    }

    // Recalcular total_kg si cambió nro_bolsas o kg_por_bolsa
    if (
      updateLoteProduccionDto.nro_bolsas ||
      updateLoteProduccionDto.kg_por_bolsa
    ) {
      const nroBolsas = updateLoteProduccionDto.nro_bolsas || lote.nro_bolsas;
      const kgPorBolsa =
        updateLoteProduccionDto.kg_por_bolsa || lote.kg_por_bolsa;
      updateLoteProduccionDto['total_kg'] = nroBolsas * kgPorBolsa;
    }

    Object.assign(lote, updateLoteProduccionDto);
    return await this.loteProduccionRepository.save(lote);
  }

  async cambiarEstado(
    id: number,
    nuevoEstado: string,
  ): Promise<LoteProduccion> {
    const lote = await this.findOne(id);

    const estadosValidos = ['disponible', 'reservado', 'vendido', 'descartado'];
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

    await this.loteProduccionRepository.remove(lote);
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

  async getInventarioPorVariedad(): Promise<any[]> {
    const resultado = await this.loteProduccionRepository
      .createQueryBuilder('lote')
      .leftJoin('lote.variedad', 'variedad')
      .leftJoin('variedad.semilla', 'semilla')
      .leftJoin('lote.categoria_salida', 'categoria')
      .select('variedad.nombre', 'variedad')
      .addSelect('semilla.nombre', 'semilla')
      .addSelect('categoria.nombre', 'categoria')
      .addSelect('SUM(lote.nro_bolsas)', 'total_bolsas')
      .addSelect('SUM(lote.total_kg)', 'total_kg')
      .where('lote.estado IN (:...estados)', {
        estados: ['disponible', 'parcialmente_vendido'],
      }) // <-- INCLUYE AMBOS ESTADOS
      .groupBy('variedad.id_variedad')
      .addGroupBy('semilla.nombre')
      .addGroupBy('categoria.id_categoria')
      .getRawMany();

    return resultado;
  }

  async getEstadisticas(idUnidad?: number): Promise<any> {
    const queryBuilder = this.loteProduccionRepository
      .createQueryBuilder('lote')
      .select('lote.estado', 'estado')
      .addSelect('COUNT(lote.id_lote_produccion)', 'cantidad')
      .addSelect('SUM(lote.total_kg)', 'peso_total')
      .addSelect('SUM(lote.nro_bolsas)', 'total_bolsas');

    if (idUnidad) {
      queryBuilder.where('lote.id_unidad = :idUnidad', { idUnidad });
    }

    const estadisticas = await queryBuilder.groupBy('lote.estado').getRawMany();

    return estadisticas;
  }
}
