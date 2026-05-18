# NEX-80 - Gestionar watchlist

## Trazabilidad

- Historia: NEX-80 Gestionar watchlist.
- Escenarios de calidad: EC-MOD-02, EC-REND-03.
- ASR: ASR-19, ASR-24.
- Modulo responsable: `watchlists`.

## Diseno

La watchlist se implementa como modulo propio porque representa una relacion
personal del trader con instrumentos de mercado. El modulo conserva bajo
acoplamiento usando contratos de otros modulos:

- `InstrumentsRepository`: valida que el simbolo exista antes de agregarlo.
- `QuotesRepository`: enriquece la lista con la cotizacion actual disponible.
- `WatchlistsRepository`: encapsula persistencia de la watchlist.

La respuesta de consulta contiene `quote: null` cuando el simbolo esta en la
watchlist pero aun no existe cotizacion actual sincronizada.

## Persistencia

Se agrega la tabla:

- `market_watchlist_items`

La tabla usa una llave unica `(trader_id, symbol)` para evitar duplicados y una
FK hacia `market_instruments(symbol)` para mantener consistencia con el catalogo
de acciones disponibles.

En Docker Compose, `market-service` usa `WATCHLISTS_REPOSITORY=mysql`.

## Validacion Manual

Importar la coleccion Postman:

```text
postman/nexus-market-service-nex-80.postman_collection.json
```

Endpoints principales:

```text
GET /api/v1/watchlists/trader-123
POST /api/v1/watchlists/trader-123/items
DELETE /api/v1/watchlists/trader-123/items/AAPL
```

Body para agregar:

```json
{
  "symbol": "AAPL"
}
```

Resultado esperado:

```json
{
  "traderId": "trader-123",
  "items": [
    {
      "symbol": "AAPL",
      "addedAt": "2026-05-16T14:00:00.000Z",
      "quote": {
        "symbol": "AAPL",
        "price": 186.4,
        "bid": 186.35,
        "ask": 186.45,
        "spread": 0.1,
        "currency": "USD",
        "provider": "alpha-vantage-compatible",
        "asOf": "2026-05-16T14:00:00.000Z"
      }
    }
  ]
}
```

## Subtarea Front

- Subtarea sugerida: `NEX-80-FE - Implementar gestion de watchlist en webapp`.
- Descripcion: Como trader, quiero agregar y quitar acciones de mi watchlist
  desde la webapp para hacer seguimiento a activos de interes.
- Alcance esperado: Front listado, boton agregar, boton eliminar, estado vacio,
  carga y error; Back no aplica, cubierto en `NEX-80`; Integracion consumo de
  `GET /api/v1/watchlists/{traderId}`, `POST /api/v1/watchlists/{traderId}/items`
  y `DELETE /api/v1/watchlists/{traderId}/items/{symbol}`.

## Subtarea Integracion

- Subtarea sugerida: `NEX-80-INT - Asociar watchlist con identidad real del trader`.
- Descripcion: Como sistema, quiero asociar la watchlist al usuario autenticado
  desde identity-service para evitar recibir manualmente el `traderId`.
- Alcance esperado: Integracion con identity-service; Back resolver usuario
  autenticado; Seguridad validacion de propietario; Pruebas con identidad mock.

## Verificacion

```powershell
npm run lint:check
npm run test:cov
npm run test:e2e
npm run build
```
