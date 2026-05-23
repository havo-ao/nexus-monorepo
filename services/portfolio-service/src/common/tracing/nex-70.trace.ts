export const NEX_70_TRACE = {
  story: 'NEX-70 Retirar fondos',
  requirement: 'RQ-125 / US-PO-13 Retirar fondos',
  qualityScenarios: [
    'EC-CONS-09: saldo disponible y reservado reconciliado con movimientos',
    'EC-AUD-03: historial financiero completo para operaciones de saldo',
  ],
  asr: [
    'ASR-17: saldo disponible validado antes de retiros',
    'transaccion atomica local para descuento y movimiento financiero',
    'rechazo controlado cuando el saldo disponible es insuficiente',
  ],
} as const;
