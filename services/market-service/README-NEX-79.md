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

## Provider Integration

Market data is resolved behind the `MARKET_DATA_PROVIDER` interface.

- Default mode without API key: static provider, so the project starts without
  external secrets and keeps deterministic test data.
- Alpha Vantage mode: set `ALPHA_VANTAGE_API_KEY` in your local environment
  before starting `market-service`. The service will select Alpha Vantage
  automatically when the key exists.
- Forced static mode: set `MARKET_DATA_PROVIDER=static` if you need mock data
  even while an API key exists in your environment.
- External calls use `ALPHA_VANTAGE_TIMEOUT_MS`, with a default value of
  `5000` milliseconds, to fail fast and preserve the last valid quote when the
  provider is unavailable.

PowerShell example:

```powershell
$env:ALPHA_VANTAGE_API_KEY = "<your-local-api-key>"
```

The API key must not be committed to Git. If the provider fails or throttles,
the synchronization flow records the failure and preserves the last known quote
data, as required by the story.

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
