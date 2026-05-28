## RF-AU-02 – Verificar correo electrónico

### Descripción  
El sistema debe verificar el correo electrónico del usuario mediante el envío de un enlace o código de verificación.

### Actor(es)  
- Trader registrado  

### Precondiciones  
- El usuario se encuentra en estado `REGISTRADO`  

### Flujo básico  
1. El sistema envía un mecanismo de verificación al correo  
2. El usuario accede al enlace o ingresa el código  
3. El sistema valida la verificación  
4. El sistema actualiza el estado a `VERIFICADO_EMAIL`  

### Flujos alternos  
- 2A. Código inválido o expirado  
  - El sistema solicita reintento  

- 2B. Solicitud de reenvío  
  - El sistema envía un nuevo código  

### Postcondiciones  
- El correo electrónico queda verificado  

### Reglas de negocio  
- RN-AU-03: El usuario no puede continuar el proceso sin verificar el correo  
