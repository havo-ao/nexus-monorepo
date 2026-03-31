## RF-CR-06 – Liberar fondos reservados

### Descripción
El sistema debe liberar fondos reservados cuando una orden pendiente es cancelada o no ejecutada.

### Actor(es)
- Sistema

### Flujo básico

1. El sistema identifica la orden cancelada
2. El sistema devuelve los fondos al saldo disponible
3. El sistema registra el movimiento

### Postcondiciones
- El saldo disponible aumenta