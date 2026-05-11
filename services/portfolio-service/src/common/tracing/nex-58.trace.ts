export const NEX_58_TRACE = {
  story: 'NEX-58 Consultar portafolio consolidado',
  requirement: 'RQ-098 / RF-PT-01 Visualizar portafolio de acciones',
  qualityScenarios: [
    'consistencia de datos del portafolio',
    'persistencia de datos de portafolio',
    'consulta rápida para visualización del trader',
  ],
  asr: [
    'SOA por dominios con base compartida',
    'monolito modular interno',
    'persistencia MySQL compartida',
    'bajo acoplamiento con trading-service y market-service',
  ],
} as const;
