# NEX-73 - Consultar dashboard principal

## Historia

Como usuario, quiero ver el dashboard principal para conocer el estado general del mercado y la plataforma.

## Criterio de aceptacion

1. Dado que el usuario ingresa al dashboard, cuando la vista carga correctamente, entonces el sistema muestra la informacion general del mercado.

## Alcance implementado

- Back: endpoint agregado de dashboard de mercado.
- Front: pendiente, vista principal del dashboard.
- BD: reutiliza cache/persistencia existente de mercados, instrumentos y cotizaciones. Incluye migracion correctiva `008_ensure_market_representative_symbols.sql` para garantizar consistencia en bases que ya tenian migraciones previas aplicadas.
- Integracion: reutiliza cotizaciones sincronizadas desde proveedor de mercado.

## Responsabilidad de Market Service

El mockup incluye informacion financiera del portafolio, fondos, posiciones y P&L. Esos datos pertenecen a `portfolio-service` y `trading-service`.

En esta historia, `market-service` entrega la parte de mercado necesaria para alimentar el dashboard:

- resumen de mercados disponibles
- conteo y muestra de instrumentos disponibles
- cotizaciones recientes
- top gainers y top losers calculados con la ultima cotizacion y el historico local disponible
- estado operativo del servicio

## Endpoint

```text
GET /api/v1/dashboard
```

## Diseno modular

Modulo responsable: `dashboard`.

```text
src/dashboard/
  controllers/
  dto/
  services/
  dashboard.module.ts
```

El dashboard no tiene entidad propia porque actua como una vista agregada de datos existentes.

## Pruebas

- Prueba unitaria de `DashboardService`.
- Prueba e2e de `GET /api/v1/dashboard`.
- Swagger documentado.
- Coleccion Postman NEX-73.

Comandos:

```bash
npm run lint:check
npm run test:cov
npm run test:e2e
npm run build
```

## Subtareas pendientes

### NEX-73-FE: Crear vista principal del dashboard

Implementar en la webapp la vista principal del dashboard consumiendo el endpoint `GET /api/v1/dashboard` de Market Service y los endpoints correspondientes de portfolio/trading cuando esten disponibles.

### NEX-73-INT: Integrar tarjetas financieras con Portfolio y Trading

Conectar las tarjetas de balance, valor de portafolio, fondos disponibles, P&L y posiciones con los servicios responsables de esos datos.

### NEX-73-CACHE: Definir cache especifica de dashboard si se requiere

Agregar cache o configuracion persistida propia del dashboard si el equipo decide que la vista agregada requiere snapshots o configuracion de widgets.
