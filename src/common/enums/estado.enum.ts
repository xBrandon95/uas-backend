export enum EstadoOrden {
  PENDIENTE = 'pendiente',
  EN_PROCESO = 'en_proceso',
  COMPLETADO = 'completado',
  CANCELADO = 'cancelado',
}

export enum EstadoLote {
  DISPONIBLE = 'disponible',
  RESERVADO = 'reservado',
  PARCIALMENTE_VENDIDO = 'parcialmente_vendido',
  VENDIDO = 'vendido',
  DESCARTADO = 'descartado',
}

export enum EstadoOrdenSalida {
  PENDIENTE = 'pendiente',
  EN_TRANSITO = 'en_transito',
  COMPLETADO = 'completado',
  CANCELADO = 'cancelado',
}

export enum TipoMovimiento {
  ENTRADA = 'entrada',
  SALIDA = 'salida',
  AJUSTE = 'ajuste',
}
