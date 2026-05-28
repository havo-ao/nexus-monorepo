export const NEX_64_TRACE = {
  story: 'NEX-64 Actualizar holdings tras compra',
  requirement: 'RQ-003, RQ-010 / US-PO-07 Actualizar holdings tras compra',
  qualityScenarios: [
    'EC-CONS-04: orden, saldo y portafolio alineados en <= 2 s',
    'EC-CONS-07: consistencia entre resumen consolidado y detalle',
  ],
  asr: [
    'ASR-15: el portafolio debe reflejar compras, ventas y valorizacion',
    'actualizacion transaccional local de holdings',
    'trazabilidad de cambios mediante movimientos persistidos',
  ],
} as const;
