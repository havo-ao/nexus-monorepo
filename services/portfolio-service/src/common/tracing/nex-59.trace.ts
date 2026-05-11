export const NEX_59_TRACE = {
  story: 'NEX-59 Consultar detalle de una posicion',
  requirement: 'RQ-099 / RF-PT-02 Acceder al detalle de una accion',
  qualityScenarios: [
    'consistencia entre portafolio consolidado y detalle de posicion',
    'consulta rapida para analisis del trader',
  ],
  asr: [
    'ASR-15: el portafolio debe reflejar compras, ventas y valorizacion',
    'monolito modular interno con controlador delgado',
    'bajo acoplamiento con market-service para precios actuales',
  ],
} as const;
