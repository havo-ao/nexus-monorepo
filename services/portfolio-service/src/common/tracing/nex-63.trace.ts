export const NEX_63_TRACE = {
  story: 'NEX-63 Visualizar distribucion por sector',
  requirement: 'RQ-074 / exposicion del portafolio por sector',
  qualityScenarios: [
    'EC-REN-03: consulta de portafolio en p95 menor o igual a 2 s',
    'EC-CONS-07: consistencia entre resumen consolidado y vistas agregadas',
  ],
  asr: [
    'ASR-15: el portafolio debe reflejar compras, ventas y valorizacion',
    'bajo acoplamiento con market-service mediante cliente dedicado',
    'agregacion determinista de exposicion por sector',
  ],
} as const;
