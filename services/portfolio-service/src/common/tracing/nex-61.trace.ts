export const NEX_61_TRACE = {
  story: 'NEX-61 Calcular rendimiento por posicion',
  requirement: 'RQ-100 / RF-PT-03 Calcular rendimiento de la posicion',
  qualityScenarios: [
    'EC-REN-04: recalculo oportuno de rendimiento frente a precios de mercado',
    'EC-CONS-08: reglas comunes para calculo individual y consolidado',
  ],
  asr: [
    'ASR-15: el portafolio debe reflejar compras, ventas y valorizacion',
    'ASR-16: valorizacion y rendimiento deben actualizarse oportunamente',
    'calculo determinista de ganancia o perdida por posicion',
  ],
} as const;
