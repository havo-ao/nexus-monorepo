## RF-CP-04 – Procesar compra en mercado abierto

### Descripción  
El sistema debe ejecutar la orden de compra cuando el mercado está abierto.

### Actor(es)  
- Sistema  

### Precondiciones  
- Orden preparada  

### Flujo básico  
1. El sistema valida saldo disponible  
2. Si saldo suficiente:
   - ejecuta la orden  
   - descuenta saldo  
   - registra la acción en portafolio  
   - calcula comisión  
   - distribuye comisión:
     - 40% comisionista (si existe)  
     - 60% Nexus  
     - o 100% Nexus  
3. El sistema notifica al usuario  

### Flujos alternos  
- 1A. Saldo insuficiente  
  - El sistema muestra error  
  - No ejecuta la orden  

### Postcondiciones  
- La acción queda registrada en el portafolio  
