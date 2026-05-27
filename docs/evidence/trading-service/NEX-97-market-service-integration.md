# NEX-97 - Trading market-service integration evidence

## Scope

`trading-service` validates market availability through `market-service` before processing trading operations.

The integration is already wired in `develop` through:

- `MARKET_SERVICE_URL=http://market-service:8884`
- `MARKET_SERVICE_TIMEOUT_MS`
- `HttpMarketServiceStatusRepository`
- `MarketValidationModule`

When `MARKET_SERVICE_URL` is configured, `trading-service` calls:

```http
GET /api/v1/market-hours/{marketCode}/status?at={evaluatedAt}
```

and maps the response to:

- `OPEN` with `canOperate=true`
- `CLOSED` with `canOperate=false`
- `RESTRICTED` with `canOperate=false`
- timeout or service error as `RESTRICTED`

The validation event is persisted in `market_validation_event`.

## ASR and quality scenarios

- **Restrict dependencies:** `trading-service` depends on the market contract through `MarketStatusRepository`.
- **Use an intermediary:** `HttpMarketServiceStatusRepository` isolates the HTTP integration.
- **Controlled timeout/error:** timeout or unavailable market-service blocks the operation with a restricted result.
- **Maintain audit trail:** every validation result is stored as a market validation event.
- **Localize changes:** market integration remains inside the `market-validation` module.

## Automated checks

From `services/trading-service`:

```bash
npm run test:ci -- market-validation
```

Expected result:

```text
Test Suites: 6 passed, 6 total
Tests:       21 passed, 21 total
```

## Manual validation

Start local services:

```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d --build
```

Validate `market-service` directly:

```bash
curl -s "http://localhost:8884/api/v1/market-hours/NYSE/status?at=2026-05-12T14:30:00.000Z"
```

Expected response:

```json
{
  "marketCode": "NYSE",
  "status": "OPEN",
  "canProcessOrder": true,
  "timezone": "America/New_York"
}
```

Validate through `trading-service`:

```bash
curl -s \
  -H "Content-Type: application/json" \
  -d '{"exchangeId":"1","evaluatedAt":"2026-05-12T14:30:00.000Z"}' \
  http://localhost:8882/api/v1/validations/market/status
```

Expected response:

```json
{
  "canOperate": true,
  "exchangeId": "1",
  "marketStatus": "OPEN",
  "timezone": "America/New_York"
}
```

## Postman

Use:

- Collection: `docs/postman/Nexus API.postman_collection.json`
- Environment: `docs/postman/Nexus Local.postman_environment.json`

Requests:

- `Trading Service / Market Validation / Validate Market Status - Open`
- `Trading Service / Market Validation / Validate Market Status - Closed`
- `Trading Service / Market Validation / Validate Market Status - Restricted`

## Swagger

- Trading Swagger: `http://localhost:8882/api/docs`
- Endpoint: `POST /api/v1/validations/market/status`
- Market Swagger: `http://localhost:8884/api/docs`
- Endpoint: `GET /api/v1/market-hours/{marketCode}/status`
