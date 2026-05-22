# NEX-76 - Consultar detalle de una accion

## Trazabilidad

- Historia: NEX-76 Consultar detalle de una accion.
- Escenarios de calidad: EC-MOD-02, EC-REND-03.
- ASR: ASR-19, ASR-24.
- Modulo responsable: `instruments`.

## Diseno

La consulta de detalle se implementa en `instruments` porque el centro de la
historia es la metadata del activo. Para enriquecer la respuesta con precio
actual, el servicio consume el contrato `QuotesRepository` exportado por
`quotes`, sin acoplarse al controlador ni a detalles internos de sincronizacion.

La respuesta incluye:

- metadata del instrumento desde `market_instruments`;
- metadata enriquecida del proveedor externo cuando se sincroniza
  `POST /api/v1/instruments/{symbol}/metadata/sync`;
- cotizacion actual desde `market_quotes`, cuando existe;
- `quote: null` cuando el activo existe pero aun no hay cotizacion disponible.

La subtarea `NEX-109` agrega la migracion `009_add_instrument_metadata.sql`
para guardar `asset_type`, `industry`, `country`, `description`,
`metadata_provider` y `metadata_updated_at` en `market_instruments`.

## Validacion Manual

Importar la coleccion Postman:

```text
postman/nexus-market-service-nex-76.postman_collection.json
```

Endpoints principales:

```text
POST /api/v1/quotes/sync
POST /api/v1/instruments/AAPL/metadata/sync
GET /api/v1/instruments/AAPL
```

Resultado esperado:

```json
{
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "marketCode": "NASDAQ",
  "currency": "USD",
  "sector": "Technology",
  "status": "ACTIVE",
  "assetType": "Common Stock",
  "industry": "Consumer Electronics",
  "country": "USA",
  "description": "Apple Inc. designs, manufactures, and markets smartphones...",
  "metadataProvider": "alpha-vantage-overview",
  "metadataUpdatedAt": "2026-05-20T18:00:00.000Z",
  "quote": {
    "symbol": "AAPL",
    "price": 186.4,
    "bid": 186.35,
    "ask": 186.45,
    "spread": 0.1,
    "currency": "USD",
    "provider": "alpha-vantage-compatible",
    "asOf": "2026-05-14T18:13:21.253Z"
  }
}
```

## Subtarea Front

- Subtarea sugerida: `NEX-76-FE - Implementar vista de detalle de una accion`.
- Descripcion: Como usuario, quiero visualizar en la webapp el detalle de una
  accion para conocer su informacion relevante antes de operar o hacer
  seguimiento.
- Alcance esperado: Front vista de detalle; Back no aplica, cubierto en
  `NEX-76`; Integracion consumo de `GET /api/v1/instruments/{symbol}`;
  Pruebas de renderizado, carga, error y activo sin cotizacion.

## Subtarea Integracion

- Subtarea sugerida: `NEX-76-INT - Enriquecer detalle de accion con proveedor externo`.
- Descripcion: Como sistema, quiero enriquecer la metadata del detalle de una
  accion desde Alpha Vantage u otro proveedor externo para mostrar informacion
  mas completa del activo.
- Alcance esperado: Integracion con proveedor externo; Back adaptador en
  `providers`; BD actualizacion de metadata en `market_instruments`; Pruebas con
  mock del proveedor, timeout y conservacion del ultimo dato valido.
- Implementacion: `POST /api/v1/instruments/{symbol}/metadata/sync` consulta
  Alpha Vantage `OVERVIEW` cuando existe API key, guarda metadata enriquecida y
  mantiene el ultimo detalle valido si el proveedor falla.

## Verificacion

```powershell
npm run lint:check
npm run test:cov
npm run test:e2e
npm run build
```
