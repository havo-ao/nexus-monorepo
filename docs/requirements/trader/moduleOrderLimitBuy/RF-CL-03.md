## RF-CL-03 – Crear orden limitada en mercado cerrado

### Descripción  
El sistema debe permitir registrar una orden limitada cuando el mercado está cerrado.

### Actor(es)  
- Trader  

### Precondiciones  
- Mercado cerrado  

### Flujo básico  
1. El sistema muestra mensaje:

"El mercado está cerrado. La acción se trazará al abrir el mercado."

2. El sistema valida saldo disponible  
3. Si saldo suficiente:
   - registra orden con estado `PENDIENTE`  
   - reserva fondos correspondientes  

### Flujos alternos  
- 2A. Saldo insuficiente  
  - El sistema informa error  

### Postcondiciones  
- La orden queda registrada para monitoreo  