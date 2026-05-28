## RF-CR-07 – Actualizar saldo tras venta de acciones

### Descripción
El sistema debe actualizar el saldo de la cartera cuando se realiza una venta de acciones.

### Actor(es)
- Sistema

### Flujo básico

1. El sistema calcula el valor de la venta
2. El sistema descuenta las comisiones correspondientes
3. El sistema incrementa el saldo disponible
4. El sistema registra la transacción

### Postcondiciones
- El saldo disponible aumenta