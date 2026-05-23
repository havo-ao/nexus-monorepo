export const NEX_69_TRACE = {
  story: 'NEX-69 Consultar historial financiero',
  requirement:
    'RQ-021, RQ-026, RQ-126 / US-PO-12 Consultar historial financiero',
  qualityScenarios: [
    'EC-AUD-03: historial completo de eventos financieros',
    'EC-CONS-09: saldo disponible y reservado reconciliado con movimientos',
  ],
  asr: [
    'ASR-17: saldo disponible y reservado reconciliado despues de movimientos',
    'consulta ordenada de transacciones financieras por trader',
    'trazabilidad por orden o transaccion origen',
  ],
} as const;
