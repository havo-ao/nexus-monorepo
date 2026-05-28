## RF-PL-07 – Notificar downgrade a plan Free

### Descripción  
El sistema debe notificar al usuario que su plan será degradado a Free si no se realiza la renovación.

### Actor(es)  
- Sistema  
- Trader Premium  

### Precondiciones  
- El plan Premium está próximo a expirar  
- No se ha registrado renovación  

### Flujo básico  
1. El sistema detecta falta de renovación  
2. El sistema notifica al usuario sobre el downgrade próximo  
3. El sistema informa impacto en funcionalidades  

### Flujos alternos  
- N/A  

### Postcondiciones  
- El usuario es informado del cambio de plan  

### Reglas de negocio  
- RN-PL-09: La notificación debe incluir pérdida de beneficios Premium  
