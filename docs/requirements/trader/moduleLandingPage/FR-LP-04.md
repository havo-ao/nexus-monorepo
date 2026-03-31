## RF-LP-04 – Acceder al inicio de sesión

### Descripción  
El sistema debe permitir a usuarios previamente registrados acceder al módulo de autenticación desde la landing page.

### Actor(es)  
- Trader (no autenticado)  
- Comisionista (no autenticado)

### Precondiciones  
- El usuario se encuentra en la landing page  
- El usuario posee una cuenta registrada  

### Flujo básico  
1. El usuario selecciona la opción "Iniciar sesión"  
2. El sistema redirige al formulario de autenticación  

### Flujos alternos  
- No aplica  

### Postcondiciones  
- El usuario accede al módulo de autenticación  

### Reglas de negocio  
- RN-04: El sistema deberá aplicar autenticación multifactor posterior al ingreso de credenciales  
