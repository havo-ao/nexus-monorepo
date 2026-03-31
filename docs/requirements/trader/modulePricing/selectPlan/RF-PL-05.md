## RF-PL-05 – Notificar configuración pendiente de plan premium

### Descripción  
El sistema debe notificar al usuario que no ha configurado su plan Premium en caso de haber adquirido uno y no haber completado su configuración.

### Actor(es)  
- Sistema  
- Trader  

### Precondiciones  
- El usuario posee plan Premium  
- No ha completado configuración  

### Flujo básico  
1. El sistema detecta configuración incompleta  
2. El sistema notifica al usuario  

### Flujos alternos  
- N/A  

### Postcondiciones  
- El usuario es informado sobre la configuración pendiente  

### Reglas de negocio  
- RN-PL-07: Las notificaciones deben enviarse de forma recurrente hasta completar la configuración  
