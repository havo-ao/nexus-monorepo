export const NEX_60_TRACE = {
  story: 'NEX-60 Calcular valor actual del portafolio',
  requirement: 'RQ-101 / RF-PT-04 Actualizar valor de acciones',
  qualityScenarios: [
    'EC-REN-04: recalculo oportuno de valorizacion frente a precios de mercado',
    'EC-CONS-07: consistencia entre resumen consolidado y detalle de posiciones',
    'EC-CONS-08: reglas comunes para calculo individual y consolidado',
  ],
  asr: [
    'ASR-15: el portafolio debe reflejar compras, ventas y valorizacion',
    'ASR-16: valorizacion y rendimiento deben actualizarse oportunamente',
    'bajo acoplamiento con market-service mediante cliente dedicado',
  ],
} as const;
