## RF-LP-08 – Restringir acceso a funcionalidades sin autenticación

### Descripción  
El sistema debe restringir el acceso a cualquier funcionalidad diferente a la landing page para usuarios no autenticados.

### Actor(es)  
- Usuario no autenticado  

### Precondiciones  
- El usuario no ha iniciado sesión  

### Flujo básico  
1. El usuario intenta acceder a una funcionalidad interna  
2. El sistema valida el estado de autenticación  
3. El sistema redirige a la landing page o al login  

### Flujos alternos  
- No aplica  

### Postcondiciones  
- El acceso no autorizado es bloqueado  

### Reglas de negocio  
- RN-08: Solo usuarios autenticados pueden acceder a funcionalidades del sistema  