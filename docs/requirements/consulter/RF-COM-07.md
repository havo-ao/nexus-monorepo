## RF-COM-07 – Consultar historial de transacciones del cliente

### Descripción
El sistema debe permitir al comisionista consultar el historial de operaciones realizadas sobre el portafolio del trader.

### Actor(es)
- Comisionista

### Precondiciones
- Existencia de contrato asociado.

### Flujo básico

1. El comisionista accede al historial del cliente.
2. El sistema muestra el listado de operaciones registradas.
3. Para cada operación se muestra:
   - tipo de operación
   - acción
   - cantidad
   - precio de ejecución
   - fecha
   - origen de la operación (trader o comisionista).
