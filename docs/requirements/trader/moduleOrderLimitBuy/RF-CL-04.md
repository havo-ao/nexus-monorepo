## RF-CL-04 – Crear orden limitada en mercado abierto

### Descripción  
El sistema debe permitir registrar una orden limitada cuando el mercado está abierto.

### Actor(es)  
- Trader  

### Flujo básico  
1. El sistema valida saldo disponible  
2. Si saldo suficiente:
   - crea orden con estado `PENDIENTE`
   - reserva fondos  

### Flujos alternos  
- 1A. Saldo insuficiente  
  - El sistema informa error  