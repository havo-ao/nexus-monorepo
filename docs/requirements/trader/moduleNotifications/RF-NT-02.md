## RF-NT-02 – Configurar canal de notificaciones

### Descripción  
El sistema debe permitir al trader definir los canales por los cuales desea recibir notificaciones.

### Actor(es)  
- Trader  

### Precondiciones  
- El usuario accede a configuración  

### Flujo básico  
1. El sistema muestra canales disponibles:
   - SMS  
   - Correo electrónico  
2. El usuario selecciona canales  
3. El sistema guarda configuración  

### Flujos alternos  
- 2A. Canal no disponible  
  - El sistema informa restricción  

### Postcondiciones  
- Los canales quedan configurados  

### Reglas de negocio  
- RN-NT-01: Algunas notificaciones críticas pueden no ser desactivables  