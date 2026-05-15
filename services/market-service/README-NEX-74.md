# NEX-74 - Consult Available Markets

## Story Traceability

- Historia: NEX-74 Consultar mercados disponibles.
- Escenarios de calidad: EC-MOD-02, EC-REND-03.
- ASR: ASR-19, ASR-24.
- Modulo responsable: `markets`.

## Persistence

The service owns the following MySQL table for this story:

- `market_catalog`

Run migrations with:

```powershell
npm run db:migrate
```

In Docker Compose, `market-service` uses `MARKETS_REPOSITORY=mysql`, so the
available market catalog is read from MySQL.

## Manual Validation

Import this Postman collection:

```text
postman/nexus-market-service-nex-74.postman_collection.json
```

Main endpoint:

```text
GET /api/v1/markets
```

Expected result includes:

```json
[
  {
    "code": "NYSE",
    "name": "New York Stock Exchange",
    "country": "United States",
    "currency": "USD",
    "timezone": "America/New_York",
    "status": "ACTIVE",
    "representativeSymbols": ["AAPL", "JPM", "KO"]
  }
]
```

## Front Subtask

- Subtarea sugerida: `NEX-74-FE: create available markets list view`.
- Alcance: consumir `GET /api/v1/markets` desde la webapp y renderizar el listado
  de mercados disponibles para el usuario.

## Verification

```powershell
npm run lint:check
npm run test:cov
npm run test:e2e
npm run build
```
