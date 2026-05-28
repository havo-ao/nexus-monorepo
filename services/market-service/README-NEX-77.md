# NEX-77 - Consultar precio actual, bid, ask y spread

## Trazabilidad

- Historia: NEX-77 Consultar precio actual, bid, ask y spread.
- Escenarios de calidad: EC-REND-03, EC-DISP-08.
- ASR: ASR-19, ASR-24.
- Modulo responsable: `quotes`.

## Diseno

La consulta se implementa en `quotes` porque reutiliza la cache de cotizaciones
creada por NEX-79. La sincronizacion y la consulta quedan separadas:

- `MarketDataSyncService`: actualiza cotizaciones desde proveedor.
- `QuoteQueryService`: consulta el ultimo dato disponible por simbolo.
- `QuoteQueryController`: expone el endpoint versionado.

No se agrega migracion nueva porque la tabla `market_quotes` ya representa la
cache persistente de precio actual, bid, ask y spread.

## Validacion Manual

Importar la coleccion Postman:

```text
postman/nexus-market-service-nex-77.postman_collection.json
```

Endpoints principales:

```text
POST /api/v1/quotes/sync
GET /api/v1/quotes/AAPL
```

Resultado esperado de consulta:

```json
{
  "symbol": "AAPL",
  "price": 186.4,
  "bid": 186.35,
  "ask": 186.45,
  "spread": 0.1,
  "currency": "USD",
  "provider": "alpha-vantage-compatible",
  "asOf": "2026-05-14T18:13:21.253Z"
}
```

## Subtarea Front

- Subtarea sugerida: `NEX-77-FE - Implementar visualizacion de precio actual de una accion`.
- Descripcion: Como trader, quiero visualizar en la webapp el precio actual,
  bid, ask y spread de una accion para evaluar condiciones de mercado.
- Alcance esperado: Front componente de cotizacion; Back no aplica, cubierto en
  `NEX-77`; Integracion consumo de `GET /api/v1/quotes/{symbol}`; Pruebas de
  renderizado, estado de carga, error y ausencia de cotizacion.

## Subtarea Integracion

- Subtarea sugerida: `NEX-77-INT - Consultar cotizacion real desde proveedor externo`.
- Descripcion: Como sistema, quiero que la cotizacion consultada provenga de
  datos sincronizados desde Alpha Vantage u otro proveedor real de mercado.
- Alcance esperado: Integracion con proveedor externo; Back adaptador en
  `providers`; BD conservacion del ultimo quote valido; Pruebas con mock del
  proveedor, timeout y fallo externo.

## Verificacion

```powershell
npm run lint:check
npm run test:cov
npm run test:e2e
npm run build
```
