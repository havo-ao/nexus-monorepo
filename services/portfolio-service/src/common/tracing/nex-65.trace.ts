export const NEX_65_TRACE = {
  story: 'NEX-65 Actualizar holdings tras venta',
  requirement: 'RQ-121, RQ-129 / US-PO-08 Actualizar holdings tras venta',
  qualityScenarios: [
    'EC-CONS-05: orden, holdings y saldo alineados en <= 2 s',
    'EC-CONS-07: consistencia entre resumen consolidado y detalle',
  ],
  asr: [
    'ASR-15: el portafolio debe reflejar compras, ventas y valorizacion',
    'actualizacion transaccional local de holdings',
    'cierre de posiciones sin cantidad disponible',
  ],
} as const;
