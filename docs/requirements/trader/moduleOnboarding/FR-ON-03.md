## RF-ON-03 – Gestionar resultado de validación financiera

### Descripción  
El sistema debe procesar la respuesta de validación externa y actualizar el estado del usuario.

### Actor(es)  
- Sistema  

### Precondiciones  
- Estado: `EN_VALIDACION`  

### Flujo básico  
1. El sistema recibe respuesta de validación  
2. Si es aprobada:
   - estado = `APROBADO`  
3. Si es rechazada:
   - estado = `RECHAZADO`  
4. El sistema notifica al usuario  

### Flujos alternos  
- 1A. Validación pendiente  
  - El sistema mantiene estado `EN_VALIDACION`  

### Postcondiciones  
- El estado del usuario es actualizado  

### Reglas de negocio  
- RN-ON-03: El usuario debe ser notificado de cualquier cambio de estado  

