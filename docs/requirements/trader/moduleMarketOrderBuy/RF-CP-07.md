## RF-CP-07 – Ejecutar orden en apertura de mercado

### Descripción  
El sistema debe ejecutar automáticamente órdenes encoladas cuando el mercado abre.

### Actor(es)  
- Sistema  

### Precondiciones  
- Estado: `PENDIENTE_EJECUCION`  
- Mercado abierto  

### Flujo básico  
1. El sistema obtiene precio de apertura  
2. El sistema recalcula total  
3. El sistema valida saldo nuevamente  
4. Si saldo suficiente:
   - ejecuta la orden  
   - descuenta saldo  
   - registra en portafolio  
   - calcula y distribuye comisión  
5. Si saldo insuficiente:
   - cambia estado a `RECHAZADA`  
6. El sistema notifica resultado  

### Postcondiciones  
- La orden es ejecutada o rechazada  

### Reglas de negocio  
- RN-CP-02: El precio de ejecución es el precio de apertura  
- RN-CP-03: La validación de saldo debe realizarse nuevamente  
