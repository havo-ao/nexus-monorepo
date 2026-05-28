## RF-NT-08 – Enviar notificaciones del sistema

### Descripción  
El sistema debe enviar notificaciones al usuario según su configuración y eventos generados.

### Actor(es)  
- Sistema  

### Precondiciones  
- Existe un evento  

### Flujo básico  
1. El sistema detecta evento  
2. El sistema valida configuración del usuario  
3. El sistema envía notificación por los canales definidos  

### Flujos alternos  
- 2A. Notificación desactivada  
  - No se envía  

### Postcondiciones  
- El usuario recibe la notificación correspondiente  

### Reglas de negocio  
- RN-NT-05: Las notificaciones deben ser trazables  
- RN-NT-06: Las notificaciones deben enviarse en tiempo oportuno  
