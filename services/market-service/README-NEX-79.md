# NEX-79 - Update Market Data

## Story Traceability

- Historia: NEX-79 Actualizar datos de mercado.
- Escenarios de calidad: EC-DISP-08, EC-REND-03.
- ASR: ASR-19, ASR-24.
- Modulo responsable: `quotes`.

## Persistence

The service owns the following MySQL tables:

- `market_quotes`
- `market_quote_history`
- `market_data_sync_events`

Run migrations with:

```powershell
npm run db:migrate
```

In Docker Compose, `market-service` uses `QUOTES_REPOSITORY=mysql`, so the
latest quote cache and synchronization events are persisted in MySQL.

## Manual Validation

Import this Postman collection:

```text
postman/nexus-market-service-nex-79.postman_collection.json
```

Main endpoint:

```text
POST /api/v1/quotes/sync
```

Example body:

```json
{
  "symbols": ["AAPL", "MSFT", "TSLA"],
  "requestedBy": "system@nexus.local"
}
```

## Verification

```powershell
npm run lint:check
npm run test:ci
npm run test:e2e
npm run build
```
