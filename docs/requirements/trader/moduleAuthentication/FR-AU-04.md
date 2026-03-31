## RF-AU-04 – Iniciar sesión

### Descripción  
El sistema debe permitir a un usuario registrado autenticarse en la plataforma.

### Actor(es)  
- Trader (plan basico)   

### Precondiciones  
- El usuario posee credenciales válidas  

### Flujo básico  
1. El usuario ingresa correo y contraseña  
2. El sistema valida credenciales  
3. El sistema inicia sesión  

### Flujos alternos  
- 2A. Credenciales incorrectas  
  - El sistema muestra error  

### Postcondiciones  
- El usuario accede al sistema  

### Reglas de negocio  
- RN-AU-05: Se debe aplicar autenticación multifactor unicamente a traders **premium**.   
