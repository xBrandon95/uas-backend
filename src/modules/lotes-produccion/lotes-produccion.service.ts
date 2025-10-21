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

@Injectable()
export class LotesProduccionService {
  constructor(
    @InjectRepository(LoteProduccion)
    private readonly loteProduccionRepository: Repository<LoteProduccion>,
    @InjectRepository(OrdenIngreso)
    private readonly ordenIngresoRepository: Repository<OrdenIngreso>,
  ) {}

  async create(
    createLoteProduccionDto: CreateLoteProduccionDto,
    idUsuarioCreador: number,
  ): Promise<LoteProduccion> {
    // 1. Buscar la orden de ingreso
    const ordenIngreso = await this.ordenIngresoRepository.findOne({
      where: { id_orden_ingreso: createLoteProduccionDto.id_orden_ingreso },
    });

    if (!ordenIngreso) {
      throw new NotFoundException(
        `Orden de ingreso ${createLoteProduccionDto.id_orden_ingreso} no encontrada`,
      );
    }

    // 2. Calcular total ya producido de esta orden
    const lotesExistentes = await this.loteProduccionRepository.find({
      where: { id_orden_ingreso: createLoteProduccionDto.id_orden_ingreso },
    });

    const totalKgProducido = lotesExistentes.reduce(
      (sum, lote) => sum + Number(lote.total_kg),
      0,
    );

    // 3. Calcular el kg del nuevo lote
    const nuevoLoteKg =
      createLoteProduccionDto.nro_bolsas * createLoteProduccionDto.kg_por_bolsa;

    // 4. Validar que no exceda el peso neto de la orden de ingreso
    const totalDespuesDeCrear = totalKgProducido + nuevoLoteKg;

    if (totalDespuesDeCrear > Number(ordenIngreso.peso_neto)) {
      throw new BadRequestException(
        `No se puede crear el lote. ` +
          `Peso neto orden de ingreso: ${ordenIngreso.peso_neto} kg. ` +
          `Ya producido: ${totalKgProducido} kg. ` +
          `Nuevo lote: ${nuevoLoteKg} kg. ` +
          `Total sería: ${totalDespuesDeCrear} kg (excede en ${totalDespuesDeCrear - Number(ordenIngreso.peso_neto)} kg)`,
      );
    }

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

  async findAll(
    rol: Role,
    idUnidadUsuario?: number,
  ): Promise<LoteProduccion[]> {
    const queryBuilder = this.loteProduccionRepository
      .createQueryBuilder('lote')
      .leftJoinAndSelect('lote.orden_ingreso', 'orden_ingreso')
      .leftJoinAndSelect('lote.variedad', 'variedad')
      .leftJoinAndSelect('lote.categoria_salida', 'categoria_salida')
      .leftJoinAndSelect('lote.unidad', 'unidad')
      .leftJoinAndSelect('lote.usuario_creador', 'usuario_creador')
      .orderBy('lote.fecha_creacion', 'DESC');

    if (rol !== Role.ADMIN && idUnidadUsuario) {
      queryBuilder.where('lote.id_unidad = :idUnidad', {
        idUnidad: idUnidadUsuario,
      });
    }

    return await queryBuilder.getMany();
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

  async getInventarioPorVariedad(
    rol: string,
    idUnidadUsuario?: number,
    idUnidadFiltro?: number,
  ): Promise<any[]> {
    const queryBuilder = this.loteProduccionRepository
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
      });

    // Si es ENCARGADO u OPERADOR, solo ve su unidad
    if (rol !== 'admin') {
      queryBuilder.andWhere('lote.id_unidad = :idUnidad', {
        idUnidad: idUnidadUsuario,
      });
    } else if (idUnidadFiltro) {
      // Si es ADMIN y filtra por unidad específica
      queryBuilder.andWhere('lote.id_unidad = :idUnidad', {
        idUnidad: idUnidadFiltro,
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
      .addSelect('SUM(lote.nro_bolsas)', 'total_bolsas');

    if (idUnidad) {
      queryBuilder.where('lote.id_unidad = :idUnidad', { idUnidad });
    }

    const estadisticas = await queryBuilder.groupBy('lote.estado').getRawMany();

    return estadisticas;
  }
}
