# NEX-75 - Consultar acciones disponibles

## Trazabilidad

- Historia: NEX-75 Consultar acciones disponibles.
- Escenarios de calidad: EC-MOD-02, EC-REND-03.
- ASR: ASR-19, ASR-24.
- Modulo responsable: `instruments`.

## Persistencia

El servicio agrega la tabla propia:

- `market_instruments`

La tabla conserva metadata de acciones disponibles y referencia el mercado
configurado en `market_catalog`.

Ejecutar migraciones con:

```powershell
npm run db:migrate
```

En Docker Compose, `market-service` usa `INSTRUMENTS_REPOSITORY=mysql`, por lo
que el listado se lee desde MySQL.

## Validacion Manual

Importar la coleccion Postman:

```text
postman/nexus-market-service-nex-75.postman_collection.json
```

Endpoint principal:

```text
GET /api/v1/instruments
```

Resultado esperado:

```json
[
  {
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "marketCode": "NASDAQ",
    "currency": "USD",
    "sector": "Technology",
    "status": "ACTIVE"
  }
]
```

## Subtarea Front

- Subtarea sugerida: `NEX-75-FE - Implementar listado de acciones disponibles en webapp`.
- Descripcion: Como usuario, quiero visualizar en la webapp el listado general
  de acciones disponibles para identificar instrumentos de interes.
- Alcance esperado: Front tabla/listado de acciones; Back no aplica, cubierto en
  `NEX-75`; Integracion consumo de `GET /api/v1/instruments`; Pruebas de
  renderizado, estado de carga, error y estado vacio.

## Subtarea Integracion

- Subtarea sugerida: `NEX-75-INT - Integrar catalogo de acciones con proveedor externo`.
- Descripcion: Como sistema, quiero sincronizar el catalogo de acciones desde un
  proveedor de mercado para mantener actualizada la metadata disponible.
- Alcance esperado: Integracion con proveedor externo; Back adaptador dentro del
  modulo `instruments` o modulo `providers`; BD actualizacion de
  `market_instruments`; Pruebas con mock del proveedor, fallo controlado y
  conservacion del ultimo catalogo valido.

## Verificacion

```powershell
npm run lint:check
npm run test:cov
npm run test:e2e
npm run build
```
