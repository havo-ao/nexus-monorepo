## RF-CR-05 – Reservar fondos para órdenes

### Descripción
El sistema debe reservar fondos cuando se crean órdenes pendientes de compra.

### Actor(es)
- Sistema

### Precondiciones
- El usuario crea una orden pendiente

### Flujo básico

1. El sistema calcula el monto requerido
2. El sistema mueve el monto desde saldo disponible a saldo reservado
3. El sistema registra la operación

### Postcondiciones
- El saldo reservado aumenta
