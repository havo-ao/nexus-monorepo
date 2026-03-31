## RF-CR-02 – Depositar fondos

### Descripción
El sistema debe permitir al trader ingresar fondos a su cartera.

### Actor(es)
- Trader

### Precondiciones
- Usuario autenticado

### Flujo básico

1. El trader selecciona opción depositar fondos
2. El sistema solicita:
   - monto a depositar
3. El sistema procesa la transacción
4. El sistema actualiza el saldo disponible
5. El sistema registra el movimiento

### Flujos alternos

**3A – Error en la transacción**

- El sistema informa al usuario

### Postcondiciones
- El saldo disponible aumenta
