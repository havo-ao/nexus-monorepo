## RF-CM-07 – Ejecutar contrato de asesoría

### Descripción  
El sistema debe permitir al comisionista enviar recomendaciones de inversión al trader.

### Actor(es)  
- Comisionista  
- Trader  

### Precondiciones  
- Estado: `ACTIVO`  
- Tipo: Asesoría  

### Flujo básico  
1. El comisionista envía recomendación  
2. El sistema notifica al trader  
3. El trader aprueba o rechaza la recomendación  

### Flujos alternos  
- 3A. Rechazo  
  - No se ejecuta acción  

### Postcondiciones  
- La recomendación es ejecutada o descartada  

### Reglas de negocio  
- RN-CM-05: Ninguna operación se ejecuta sin aprobación del trader  
