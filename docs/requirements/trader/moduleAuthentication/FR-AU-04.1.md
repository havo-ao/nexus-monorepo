## RF-AU-04.1 – Incio de sesion MFA 

### Descripción  
El sistema debe permitir a un usuario premium registrado acceder a la plataforma.

### Actor(es)  
- Trader Premium     

### Precondiciones  
- El usuario posee credenciales válidas  

### Flujo básico  
1. El usuario ingresa correo y contraseña  
2. El sistema valida credenciales  
3. El sistema envia un codigo numerico de 6 caracteres a SMS o Correo según configuracion del usuario.   
4. El usuario ingresa el codigo  
5. El sistema valida el codigo.   
6. El usuario ingresa al sistema.   

### Flujos alternos  
- 2A. Credenciales incorrectas  
  - El sistema muestra error 
- 2B. Codigo incorrecto
  - El sistema muestra error
- 2C. Codigo no recibido
  - Permite al usuario solictar reenvio o alternar a SMS o Correo.  

### Postcondiciones  
- El usuario accede al sistema  

### Reglas de negocio  
- RN-AU-05: Se debe aplicar autenticación multifactor unicamente a traders **premium**.   
