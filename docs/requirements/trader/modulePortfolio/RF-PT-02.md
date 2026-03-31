## RF-PT-02 – Acceder al detalle de una acción

### Descripción  
El sistema debe permitir al trader acceder a un módulo detallado de cada acción en su portafolio.

### Actor(es)  
- Trader  

### Precondiciones  
- El usuario selecciona una acción  

### Flujo básico  
1. El sistema muestra información detallada:
   - símbolo  
   - cantidad total de acciones  
   - precio promedio de compra  
   - precio actual de mercado  
   - valor total invertido  
   - valor actual de la posición  
   - ganancia o pérdida absoluta  
   - ganancia o pérdida porcentual  

### Postcondiciones  
- El usuario puede analizar el rendimiento de la acción  

### Reglas de negocio  
- RN-PT-01: El precio actual debe actualizarse periódicamente con datos de mercado  
