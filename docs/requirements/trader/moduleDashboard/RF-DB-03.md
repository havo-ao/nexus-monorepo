## RF-DB-03 – Visualizar detalle de acción

### Descripción  
El sistema debe mostrar información detallada de una acción según los datos de mercado disponibles.

### Actor(es)  
- Trader  

### Precondiciones  
- El usuario selecciona una acción  

### Flujo básico  
1. El sistema muestra:
   - Símbolo  
   - Precio de compra (ask price)  
   - Precio de venta (bid price)  
   - Volumen de compra (ask size)  
   - Volumen de venta (bid size)  
   - Exchange (ask y bid)  
   - Condiciones de cotización  
   - Timestamp  
   - Tape  
2. El sistema actualiza la información periódicamente  

### Flujos alternos  
- N/A  

### Postcondiciones  
- El usuario comprende el estado actual de la acción  

### Reglas de negocio  
- RN-DB-03: La información debe reflejar datos actualizados del mercado  
- RN-DB-04: Los datos deben corresponder a la fuente de mercado integrada  
