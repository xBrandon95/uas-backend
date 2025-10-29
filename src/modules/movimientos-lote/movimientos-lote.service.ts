import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MovimientoLote } from './entities/movimiento-lote.entity';

@Injectable()
export class MovimientosLoteService {
  constructor(
    @InjectRepository(MovimientoLote)
    private readonly movimientoRepository: Repository<MovimientoLote>,
  ) {}

  async getHistorialByLote(idLote: number): Promise<MovimientoLote[]> {
    return await this.movimientoRepository.find({
      where: { id_lote_produccion: idLote },
      relations: ['usuario', 'orden_salida', 'orden_salida.cliente'],
      order: { fecha_movimiento: 'DESC' },
    });
  }

  async getMovimientosByOrdenSalida(
    idOrden: number,
  ): Promise<MovimientoLote[]> {
    return await this.movimientoRepository.find({
      where: { id_orden_salida: idOrden },
      relations: ['lote_produccion', 'usuario'],
      order: { fecha_movimiento: 'DESC' },
    });
  }

  async getResumenMovimientos(idLote: number) {
    const movimientos = await this.getHistorialByLote(idLote);

    const entradas = movimientos
      .filter((m) => m.tipo_movimiento === 'entrada')
      .reduce((sum, m) => sum + Number(m.kg_movidos), 0);

    const salidas = movimientos
      .filter((m) => m.tipo_movimiento === 'salida')
      .reduce((sum, m) => sum + Number(m.kg_movidos), 0);

    return {
      total_entradas: entradas,
      total_salidas: salidas,
      saldo_actual: entradas - salidas,
      cantidad_movimientos: movimientos.length,
    };
  }
}
