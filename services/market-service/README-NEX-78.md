# NEX-78 - Consultar historico de precios

## Trazabilidad

- Historia: NEX-78 Consultar historico de precios.
- Escenarios de calidad: EC-REND-03, EC-DISP-08.
- ASR: ASR-19, ASR-24.
- Modulo responsable: `quotes`.

## Diseno

La consulta historica se implementa en `quotes` porque el dato principal es una
serie temporal de cotizaciones. La historia reutiliza la persistencia creada en
NEX-79:

- `market_quote_history`: snapshots historicos.
- `market_quotes`: ultimo dato valido, usado por NEX-77.

No se agrega migracion nueva porque `market_quote_history` ya representa la
persistencia de series temporales requerida por esta historia.

## Validacion Manual

Importar la coleccion Postman:

```text
postman/nexus-market-service-nex-78.postman_collection.json
```

Endpoints principales:

```text
POST /api/v1/quotes/sync
GET /api/v1/quotes/AAPL/history
```

Resultado esperado:

```json
{
  "symbol": "AAPL",
  "prices": [
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
  ]
}
```

## Subtarea Front

- Subtarea sugerida: `NEX-78-FE - Implementar grafico historico de precios`.
- Descripcion: Como trader, quiero visualizar en la webapp el historico de
  precios de una accion para analizar el comportamiento del activo.
- Alcance esperado: Front grafico historico; Back no aplica, cubierto en
  `NEX-78`; Integracion consumo de `GET /api/v1/quotes/{symbol}/history`;
  Pruebas de renderizado, carga, error y serie vacia.

## Subtarea Integracion

- Subtarea sugerida: `NEX-78-INT - Sincronizar historico real desde proveedor externo`.
- Descripcion: Como sistema, quiero sincronizar series historicas desde Alpha
  Vantage u otro proveedor para alimentar el analisis historico del trader.
- Alcance esperado: Integracion con proveedor externo; Back adaptador en
  `providers`; BD persistencia en `market_quote_history`; Pruebas con mock del
  proveedor, timeout, fallo externo y conservacion de datos historicos locales.

## Verificacion

```powershell
npm run lint:check
npm run test:cov
npm run test:e2e
npm run build
```
