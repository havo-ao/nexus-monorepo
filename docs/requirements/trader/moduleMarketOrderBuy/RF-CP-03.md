## RF-CP-03 – Preparar orden de compra en mercado abierto

### Descripción  
El sistema debe permitir preparar una orden de compra cuando el mercado está abierto.

### Actor(es)  
- Trader  

### Precondiciones  
- Mercado en horario operativo  

### Flujo básico  
1. El sistema solicita cantidad de acciones  
2. El sistema calcula:
   - Subtotal (precio × cantidad)  
   - Comisión  
   - Total  
3. El sistema muestra resumen al usuario  

### Flujos alternos  
- 1A. Cantidad inválida  
  - El sistema solicita corrección  

### Reglas de negocio  
- RN-CP-01: El cálculo debe basarse en el precio actual de mercado  
