# NEX-81 - Monitorear precio objetivo

## Historia

Como trader, quiero definir un precio objetivo para recibir seguimiento sobre una accion.

## Criterios de aceptacion

1. Dado que el usuario define un precio objetivo valido, cuando guarda la configuracion, entonces el sistema registra la regla de monitoreo.
2. Dado que el precio objetivo se cumple, cuando el sistema evalua la condicion, entonces genera el evento correspondiente.

## Alcance implementado

- Back: endpoints versionados para crear, consultar y evaluar alertas de precio.
- BD: tablas `market_price_alerts` y `market_price_alert_events`.
- Integracion interna: usa instrumentos disponibles y cotizaciones actuales del modulo `quotes`.
- Integracion externa pendiente: notificacion hacia `compliance-service`.
- Front pendiente: formulario para definir precio objetivo y listado de alertas.

## Diseno modular

Modulo responsable: `price-alerts`.

Estructura:

```text
src/price-alerts/
  controllers/
  dto/
  entities/
  repositories/
  services/
  price-alerts.module.ts
```

Responsabilidades:

- Controller: expone endpoints delgados.
- Service: valida reglas de negocio, consulta instrumentos, consulta precios y evalua condiciones.
- Repository: encapsula persistencia en memoria o MySQL.
- Entities: protegen invariantes del dominio.

## Endpoints

```text
POST /api/v1/price-alerts
GET /api/v1/price-alerts/{traderId}
POST /api/v1/price-alerts/evaluate
```

Ejemplo de creacion:

```json
{
  "traderId": "trader-123",
  "symbol": "AAPL",
  "targetPrice": 180,
  "condition": "ABOVE_OR_EQUAL"
}
```

## Persistencia

Se agrego la migracion:

```text
database/migrations/007_create_market_price_alerts.sql
```

La tabla `market_price_alerts` guarda la regla de monitoreo por trader, simbolo, precio objetivo, condicion y estado. La tabla `market_price_alert_events` registra el evento cuando una alerta activa se cumple.

## Trazabilidad arquitectonica

- Historia: NEX-81.
- Escenarios de calidad impactados: auditabilidad de eventos, consistencia de reglas, modificabilidad por modulo.
- ASR relacionados: persistencia trazable de reglas, bajo acoplamiento con proveedor de mercado y servicios externos.
- Tacticas: separacion por modulo, repositorio para persistencia, eventos persistidos y controladores delgados.

## Pruebas

Pruebas unitarias:

- entidad de alerta
- entidad de evento
- repositorio en memoria
- repositorio MySQL con pool mockeado
- servicio de reglas y evaluacion

Prueba e2e:

- sincroniza cotizacion
- crea alerta
- consulta alertas del trader
- evalua reglas activas
- verifica evento generado

Comandos:

```bash
npm run lint:check
npm run test:cov
npm run test:e2e
npm run build
```

## Subtareas pendientes

### NEX-81-FE: Crear vista para definir precio objetivo

Implementar en la webapp el formulario para seleccionar una accion, ingresar precio objetivo, elegir condicion y consultar alertas creadas.

### NEX-81-INT: Integrar eventos de alerta con compliance-service

Conectar el evento generado por `POST /api/v1/price-alerts/evaluate` con `compliance-service` o el mecanismo de notificacion definido por el equipo.

### NEX-81-JOB: Automatizar evaluacion periodica de alertas

Agregar un job programado o mecanismo equivalente para ejecutar la evaluacion de alertas sin depender de una llamada manual al endpoint.
