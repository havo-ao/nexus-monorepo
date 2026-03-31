## RF-CR-03 – Retirar fondos

### Descripción
El sistema debe permitir al trader retirar fondos de su cartera.

### Actor(es)
- Trader

### Precondiciones
- Usuario autenticado
- saldo disponible suficiente

### Flujo básico

1. El trader selecciona retirar fondos
2. El sistema solicita:
   - monto a retirar
3. El sistema valida saldo disponible
4. El sistema procesa el retiro
5. El sistema actualiza saldo disponible
6. El sistema registra la transacción

### Flujos alternos

**3A – Saldo insuficiente**

- El sistema informa al usuario

### Postcondiciones
- El saldo disponible disminuye
