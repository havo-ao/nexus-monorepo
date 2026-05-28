## RF-CP-06 – Preparar orden en mercado cerrado

### Descripción  
El sistema debe permitir crear una orden de compra encolada cuando el mercado está cerrado.

### Actor(es)  
- Trader  

### Flujo básico  
1. El sistema solicita cantidad  
2. El sistema estima valores  
3. El sistema valida saldo  
4. Si saldo suficiente:
   - registra orden con estado `PENDIENTE_EJECUCION`  

### Flujos alternos  
- 3A. Saldo insuficiente  
  - El sistema muestra error  
