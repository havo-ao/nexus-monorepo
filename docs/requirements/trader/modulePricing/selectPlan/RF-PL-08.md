## RF-PL-08 – Ejecutar downgrade automático a plan Free

### Descripción  
El sistema debe cambiar automáticamente el plan del usuario a Free cuando el plan Premium expira sin renovación.

### Actor(es)  
- Sistema  

### Precondiciones  
- El plan Premium ha expirado  
- No se ha realizado renovación  

### Flujo básico  
1. El sistema detecta expiración del plan  
2. El sistema cambia el plan del usuario a Free  
3. El sistema desactiva funcionalidades Premium  
4. El sistema notifica al usuario  

### Flujos alternos  
- N/A  

### Postcondiciones  
- El usuario queda con plan Free activo  

### Reglas de negocio  
- RN-PL-10: Las funcionalidades Premium deben deshabilitarse inmediatamente tras el downgrade  
