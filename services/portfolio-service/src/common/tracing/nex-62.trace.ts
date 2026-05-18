export const NEX_62_TRACE = {
  story: 'NEX-62 Calcular rentabilidad consolidada',
  requirement: 'RQ-100, RQ-101 / rentabilidad acumulada del portafolio',
  qualityScenarios: [
    'EC-CONS-08: consistencia entre calculo individual y consolidado',
    'EC-REN-04: resumen financiero actualizado con datos de mercado',
  ],
  asr: [
    'ASR-15: el portafolio debe reflejar compras, ventas y valorizacion',
    'ASR-16: valorizacion y rendimiento deben actualizarse oportunamente',
    'calculo consolidado derivado de la misma base de posiciones',
  ],
} as const;
