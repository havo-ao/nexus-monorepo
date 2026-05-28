# NEX-83 - Administer Market Hours And Restrictions

## Story Traceability

- Historia: NEX-83 Administrar horarios y restricciones de mercado.
- Escenarios de calidad: EC-DISP-08, EC-AUD-06.
- ASR: ASR-19, ASR-24.
- Modulo responsable: `market-hours`.

## Persistence

The service owns the following MySQL tables:

- `market_hours_configs`
- `market_restrictions`
- `market_configuration_events`

Run migrations with:

```powershell
npm run db:migrate
```

In Docker Compose, `market-service` runs migrations before `npm run start:dev`.
For a clean local environment, run:

```powershell
.\infrastructure\docker\start-local.ps1
```

The script creates `infrastructure/docker/.env` with local values if the file
does not exist, then starts Docker Compose with that environment file.

## Manual Validation

Import this Postman collection:

```text
postman/nexus-market-service-nex-83.postman_collection.json
```

Main endpoints:

```text
PUT /api/v1/admin/market-hours/:marketCode
POST /api/v1/admin/market-hours/:marketCode/restrictions
GET /api/v1/market-hours/:marketCode/status
```

## Verification

```powershell
npm run lint:check
npm run test:ci
npm run test:e2e
npm run build
```
