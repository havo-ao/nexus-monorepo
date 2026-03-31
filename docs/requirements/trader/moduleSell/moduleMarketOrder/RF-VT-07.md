## RF-VT-07 – Registrar venta pendiente

### Descripción  
El sistema debe registrar una venta pendiente cuando el mercado está cerrado.

### Actor(es)  
- Sistema  

### Flujo básico  

1. El sistema registra la orden  
2. La orden queda con estado:

`PENDIENTE_EJECUCION`

3. La orden se ejecutará al abrir el mercado  
